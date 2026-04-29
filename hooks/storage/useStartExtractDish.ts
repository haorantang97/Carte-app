import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/hooks/auth/useSession';
import { cacheBus } from '@/lib/cacheKeys';
import { readEdgeError } from '@/lib/edgeError';

export interface StartExtractInput {
  groupId: string;
  categoryId: string;
  /** Provide one of these */
  url?: string;
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

/**
 * 非阻塞 AI 提取流程:
 *
 * 1. 立刻 insert 一条占位 dish (extract_status='extracting'),返回 dish_id
 * 2. 客户端立即关闭 sheet → 用户回到列表 → realtime 推送占位卡
 * 3. 调 extract-recipe edge function (传 dish_id),它会:
 *    - 更新 extract_stage 阶段进度 (fetching → integrating → null)
 *    - 完成后写回 dish 所有字段 (name / ingredients / cook_steps / cuisine / 营养 / ...)
 *    - 失败时设 extract_status='error' + extract_error
 * 4. realtime 自动推送变更,UI 卡片随之刷新
 *
 * 客户端不 await edge function - 用户可以离开页面继续做别的事,
 * extraction 在 supabase 那边继续跑,完成后 DB 状态就到位了。
 */
export function useStartExtractDish() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: StartExtractInput): Promise<{ dishId: string }> => {
      if (!user?.id) throw new Error('Not signed in');

      // 1. Insert placeholder dish row
      const placeholderName = input.url
        ? '正在解析链接…'
        : input.imageBase64
          ? '正在识别图片…'
          : '正在生成菜谱…';
      const { data: created, error: insertErr } = await supabase
        .from('dishes')
        .insert({
          group_id: input.groupId,
          category_id: input.categoryId,
          name: placeholderName,
          extract_status: 'extracting',
          extract_stage: input.url ? 'fetching' : 'integrating',
          extract_started_at: new Date().toISOString(),
          source_url: input.url ?? null,
          ingredients: [],
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      const dishId = created.id;

      // 2. 立刻 invalidate 让占位卡出现在列表里
      cacheBus.afterDishMutate(qc, input.groupId, dishId);

      // 3. 后台启动 edge function (不 await, 返回给用户后继续)
      void supabase.functions
        .invoke('extract-recipe', {
          body: {
            dish_id: dishId,
            url: input.url,
            text: input.text,
            imageBase64: input.imageBase64,
            imageMimeType: input.imageMimeType,
          },
        })
        .then(async ({ error }) => {
          if (error) {
            const real = await readEdgeError(error);
            // edge function 已经会自己 mark 'error',这里 fallback 处理
            // 比如 supabase relay 在 client → edge 之间失败时
            await supabase
              .from('dishes')
              .update({
                extract_status: 'error',
                extract_stage: null,
                extract_error: real.slice(0, 500),
              })
              .eq('id', dishId)
              .eq('extract_status', 'extracting'); // 仅当 still extracting 时才标
          }
        })
        .catch(() => {
          // network throw - same fallback
          void supabase
            .from('dishes')
            .update({
              extract_status: 'error',
              extract_stage: null,
              extract_error: 'Network error',
            })
            .eq('id', dishId)
            .eq('extract_status', 'extracting');
        });

      return { dishId };
    },
  });
}

/**
 * 让用户重试一个失败的提取(状态为 'error' 的 dish)。
 * 把 extract_status 改回 'extracting' 再调 edge function。
 */
export function useRetryExtractDish() {
  const { user } = useSession();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { dishId: string; groupId: string }) => {
      if (!user?.id) throw new Error('Not signed in');

      // Reset status,读取 source_url 再调
      const { data: row, error: rErr } = await supabase
        .from('dishes')
        .select('id, source_url')
        .eq('id', input.dishId)
        .single();
      if (rErr || !row?.source_url) throw new Error('No source URL to retry');

      const { error: uErr } = await supabase
        .from('dishes')
        .update({
          extract_status: 'extracting',
          extract_stage: 'fetching',
          extract_error: null,
          extract_started_at: new Date().toISOString(),
        })
        .eq('id', input.dishId);
      if (uErr) throw uErr;

      cacheBus.afterDishMutate(qc, input.groupId, input.dishId);

      void supabase.functions.invoke('extract-recipe', {
        body: { dish_id: input.dishId, url: row.source_url },
      });
    },
  });
}
