import { Share } from 'react-native';

/**
 * 分享内容生成器 — 占位域名,等买真实域名后改这里一处即可。
 *
 * 路线图:
 * 1. 现在:占位 URL,系统分享 sheet 工作但链接打不开(纯占位)
 * 2. 域名买了 + 配 universal link → iOS 内点链接直接跳 app
 * 3. 做了小程序 + 接 react-native-wechat-lib → 分享到微信走小程序卡片(更原生)
 * 4. 做了 web 落地页 → 微信 / iMessage / 邮件能展开 OG 卡片预览
 */
const SHARE_BASE_URL = 'https://carte.app'; // ← 改这里

export interface ShareableDish {
  id: string;
  name: string;
  description?: string | null;
  chef_username?: string | null;
  group_name?: string | null;
}

export function getDishShareUrl(dishId: string): string {
  return `${SHARE_BASE_URL}/dish/${dishId}`;
}

export async function shareDish(dish: ShareableDish): Promise<void> {
  const url = getDishShareUrl(dish.id);
  const lines: string[] = [`${dish.name}`];
  if (dish.chef_username && dish.group_name) {
    lines.push(`${dish.chef_username} 在「${dish.group_name}」的菜单`);
  } else if (dish.group_name) {
    lines.push(`「${dish.group_name}」菜单`);
  }
  if (dish.description) {
    lines.push(dish.description.slice(0, 80));
  }
  lines.push(url);
  const message = lines.join('\n');
  try {
    await Share.share({ message, url, title: dish.name });
  } catch {
    // user cancelled — silent
  }
}
