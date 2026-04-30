import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RouteMode =
  | 'native_gemini'
  | 'html_recipe_jsonld'
  | 'html_fetch'
  | 'html_fetch_simple'
  | 'user_input_only'
  | 'apify';

// =============================================================================
// APIFY_ACTORS — Apify actor 元数据集中表(单一真相)
//
// 加新 actor 时必须填齐:
//   - buildInput: 真实输入构造函数(参考 schemaDoc 文档)
//   - schemaDoc:  Apify Store input schema URL,改的人能溯源
//   - sampleUrl:  已知能成功的 URL(允许 'TODO' 占位,但 verified 必须 false)
//   - verified:   是否已实际跑通 sampleUrl
//
// 已知踩过的坑:
//   - easyapi/all-in-one-rednote-xiaohongshu-scraper 没有抓单条 post 的 mode,
//     名字 "all-in-one" 误导(指多查询维度,非内容类型)。已改为 zhorex。
// =============================================================================
interface ApifyActorConfig {
  buildInput: (url: string) => unknown;
  schemaDoc: string;
  sampleUrl: string;
  timeoutSec?: number;
  verified?: boolean;
}

const APIFY_ACTORS: Record<string, ApifyActorConfig> = {
  // --- 已 schema + 实测验证(2026-04-30) ---
  // 已知坑(实测):
  //   1. actor 只接受 /explore/<id> 路径,/discovery/item/<id> 会卡死直至超时(actor 内部 URL 解析 bug)
  //   2. 必须保留 xsec_token query 参数,否则 RedNote 拒绝访问,actor 返回 blocked item
  //   3. 必须显式传 proxyConfiguration:RESIDENTIAL,schema 有 default 但 API 调用不 apply schema default
  'zhorex/rednote-xiaohongshu-scraper': {
    buildInput: (url) => ({
      mode: 'post_details',
      postUrls: [url.replace('/discovery/item/', '/explore/')],
      proxyConfiguration: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    }),
    schemaDoc: 'https://apify.com/zhorex/rednote-xiaohongshu-scraper/input-schema',
    sampleUrl: 'https://www.xiaohongshu.com/explore/69392d77000000001e0105a7?xsec_token=CBtoGJKhbhlmTLhKMdKfIjk5UC5l05mFnWiTFbTrO9-wU=',
    timeoutSec: 80,
    verified: true, // 2026-04-30 直接 API 实测通过(返回 title/videoUrl/likes/...)
  },

  // --- ✅ 实测验证通过(2026-04-30) ---
  'apify/facebook-pages-scraper': {
    buildInput: (url) => ({ startUrls: [{ url }] }),
    schemaDoc: 'https://apify.com/apify/facebook-pages-scraper/input-schema',
    sampleUrl: 'https://www.facebook.com/copperkettleyqr/',
    timeoutSec: 60,
    verified: true,
  },
  'trudax/reddit-scraper-lite': {
    // schema required: ['proxy']
    buildInput: (url) => ({
      startUrls: [{ url }],
      maxItems: 1,
      proxy: { useApifyProxy: true, apifyProxyGroups: ['RESIDENTIAL'] },
    }),
    schemaDoc: 'https://apify.com/trudax/reddit-scraper-lite/input-schema',
    sampleUrl: 'https://www.reddit.com/r/pasta/comments/vwi6jx/pasta_peperoni_and_ricotta_cheese_how_to_make/',
    timeoutSec: 60,
    verified: true,
  },
  'apple_yang/douyin-transcripts-scraper': {
    // schema required: ['videoUrl'](单数 string,不是数组)
    buildInput: (url) => ({ videoUrl: url }),
    schemaDoc: 'https://apify.com/apple_yang/douyin-transcripts-scraper/input-schema',
    sampleUrl: 'https://www.douyin.com/video/7534679152504376595',
    timeoutSec: 90,
    verified: true,
  },
  'easyapi/douyin-video-downloader': {
    // schema required: ['links'](数组)。返回内容嵌套在 item.result 里
    buildInput: (url) => ({ links: [url] }),
    schemaDoc: 'https://apify.com/easyapi/douyin-video-downloader/input-schema',
    sampleUrl: 'https://www.douyin.com/video/7534679152504376595',
    timeoutSec: 60,
    verified: true,
  },
  'apple_yang/bilibili-transcripts-scraper': {
    // schema required: ['videoUrl']
    buildInput: (url) => ({ videoUrl: url }),
    schemaDoc: 'https://apify.com/apple_yang/bilibili-transcripts-scraper/input-schema',
    sampleUrl: 'https://www.bilibili.com/video/BV1ojn8z1EUq',
    timeoutSec: 90,
    verified: true,
  },
  'easyapi/bilibili-video-downloader': {
    // schema required: ['links']。result 含详细 description
    buildInput: (url) => ({ links: [url] }),
    schemaDoc: 'https://apify.com/easyapi/bilibili-video-downloader/input-schema',
    sampleUrl: 'https://www.bilibili.com/video/BV1ojn8z1EUq',
    timeoutSec: 60,
    verified: true,
  },
  'natanielsantos/kuaishou-scraper': {
    // schema 字段: videoUrls(array)
    buildInput: (url) => ({ videoUrls: [url] }),
    schemaDoc: 'https://apify.com/natanielsantos/kuaishou-scraper/input-schema',
    sampleUrl: 'https://www.kuaishou.com/short-video/3xhf4kv5ahrt8cy',
    timeoutSec: 60,
    verified: true,
  },
  'dltik/niconico-scraper': {
    // schema 字段: url(单数) 或 urls(数组)
    buildInput: (url) => ({ url }),
    schemaDoc: 'https://apify.com/dltik/niconico-scraper/input-schema',
    sampleUrl: 'https://www.nicovideo.jp/watch/sm9',
    timeoutSec: 60,
    verified: true,
  },
  'logical_scrapers/threads-post-scraper': {
    // 替换原 apify/threads-profile-api-scraper(后者按 username 抓 profile,不能按 single post URL)
    // schema required: ['startUrls']。实测返回 thread.text(完整 post 内容) + author + likes
    buildInput: (url) => ({
      startUrls: [{ url }],
      proxyConfiguration: { useApifyProxy: true },
    }),
    schemaDoc: 'https://apify.com/logical_scrapers/threads-post-scraper/input-schema',
    sampleUrl: 'https://www.threads.net/@hormozi/post/DXt241CmroI',
    timeoutSec: 60,
    verified: true, // 2026-04-30 实测通过(20s 返回 thread.text 完整 post 内容)
  },

  // --- 🟡 schema 字段名正确但未实测过(input 应该对,需要真实 sample URL 验证) ---
  // 已实测验证(2026-04-30): instagram-scraper 接受 directUrls(profile 或 post URL),返回 caption + displayUrl
  'apify/instagram-scraper': {
    buildInput: (url) => ({ directUrls: [url], resultsLimit: 1, addParentData: false }),
    schemaDoc: 'https://apify.com/apify/instagram-scraper/input-schema',
    sampleUrl: 'https://www.instagram.com/humansofny/',
    timeoutSec: 60,
    verified: true,
  },
  // 已实测验证: tiktok-scraper 接受 postURLs(虽然 schema 主要是 hashtag/profile,但 fields 也含 postURLs)
  'clockworks/tiktok-scraper': {
    buildInput: (url) => ({ postURLs: [url], resultsPerPage: 1 }),
    schemaDoc: 'https://apify.com/clockworks/tiktok-scraper/input-schema',
    sampleUrl: 'https://www.tiktok.com/@apifyoffice/video/7200360993149553925',
    timeoutSec: 60,
    verified: true,
  },
  'clockworks/tiktok-video-scraper': {
    buildInput: (url) => ({ postURLs: [url], resultsPerPage: 1 }),
    schemaDoc: 'https://apify.com/clockworks/tiktok-video-scraper/input-schema',
    sampleUrl: 'https://www.tiktok.com/@apifyoffice/video/7200360993149553925',
    timeoutSec: 60,
    verified: true,
  },
  'apify/facebook-posts-scraper': {
    buildInput: (url) => ({ startUrls: [{ url }], resultsLimit: 1 }),
    schemaDoc: 'https://apify.com/apify/facebook-posts-scraper/input-schema',
    sampleUrl: 'https://www.facebook.com/humansofnewyork/',
    timeoutSec: 60,
    verified: true,
  },
  // ⚠ 2026-04-30 实测: 所有 input 模式(startUrls/searchTerms)都返回 noResults。
  // X 反爬升级,actor 持续不工作。input 字段保留对的,等 actor 修复或换 actor 时立即可用。
  'apidojo/tweet-scraper': {
    buildInput: (url) => ({ startUrls: [url], maxItems: 1 }),
    schemaDoc: 'https://apify.com/apidojo/tweet-scraper/input-schema',
    sampleUrl: 'BROKEN_X_ANTI_SCRAPE',
    timeoutSec: 60,
    verified: false,
  },

  // --- 🟡 schema 字段已修对,但实测时 sample URL 不可用,真实 URL 应该能跑 ---
  'easyapi/dailymotion-video-downloader': {
    // schema required: ['links']。实测 sample URL `x9hcw4o` 返回 404(URL 不存在),真实 URL 待用户提供
    buildInput: (url) => ({ links: [url] }),
    schemaDoc: 'https://apify.com/easyapi/dailymotion-video-downloader/input-schema',
    sampleUrl: 'TODO_real_dailymotion_url',
    timeoutSec: 60,
    verified: false,
  },
  'apify/instagram-reel-scraper': {
    // schema required: ['username'],描述说也接受 direct reel URLs。实测我用的 reel URL 返回 restricted_page,真实 reel URL 待验证
    buildInput: (url) => ({ username: [url], resultsLimit: 1 }),
    schemaDoc: 'https://apify.com/apify/instagram-reel-scraper/input-schema',
    sampleUrl: 'TODO_real_reel_url',
    timeoutSec: 60,
    verified: false,
  },
  'eiv/pinterest-fetcher': {
    // 替换原 easyapi/pinterest-search-scraper(那个是搜索 actor,不接受 pin URL)
    // schema 接受 startUrls(数组,字符串或对象都可),支持 pin detail/profiles/collections/search URLs
    // 2026-04-30 实测真实 pin URL 通过(返回 title + description + image_url)。
    // schema 默认 example pin (1054827...)已被删,任何活跃 pin URL 都能跑。
    buildInput: (url) => ({
      startUrls: [url],
      maxItems: 1,
      proxyConfig: { useApifyProxy: true },
    }),
    schemaDoc: 'https://apify.com/eiv/pinterest-fetcher/input-schema',
    sampleUrl: 'https://www.pinterest.com/pin/4503668374233999/',
    timeoutSec: 90,
    verified: true,
  },
};

// 已删除 4 个选错类型的 actor (Phase 2,2026-04-30):
//   - apify/threads-profile-api-scraper       → 替换为 logical_scrapers/threads-post-scraper
//   - easyapi/pinterest-search-scraper        → 替换为 eiv/pinterest-fetcher
//   - piotrv1001/weibo-scraper                → weibo 改走 html_fetch (m.weibo.cn 是静态 HTML)
//   - oxygenated_quagmire/naver-blog-search   → naver 改走 html_fetch (blog.naver.com 是静态 HTML)

interface PlatformRoute {
  mode: RouteMode;
  primary?: string;
  fallback?: string;
  warning?: string;
}

const ROUTES: Record<string, PlatformRoute> = {
  'instagram.com': { mode: 'apify', primary: 'apify/instagram-scraper', fallback: 'apify/instagram-reel-scraper' },
  'tiktok.com':    { mode: 'apify', primary: 'clockworks/tiktok-scraper', fallback: 'clockworks/tiktok-video-scraper' },
  'youtube.com':   { mode: 'native_gemini' },
  'youtu.be':      { mode: 'native_gemini' },
  // facebook.com: 删除 fallback(facebook-pages-scraper 抓 page 概览不是 post 内容,作为 fallback 没意义)
  'facebook.com':  { mode: 'apify', primary: 'apify/facebook-posts-scraper' },
  'fb.watch':      { mode: 'apify', primary: 'apify/facebook-posts-scraper' },
  'threads.net':   { mode: 'apify', primary: 'logical_scrapers/threads-post-scraper' },
  'twitter.com':   { mode: 'apify', primary: 'apidojo/tweet-scraper' },
  'x.com':         { mode: 'apify', primary: 'apidojo/tweet-scraper' },
  'reddit.com':    { mode: 'apify', primary: 'trudax/reddit-scraper-lite' },
  'pinterest.com': { mode: 'apify', primary: 'eiv/pinterest-fetcher' },
  'pin.it':        { mode: 'apify', primary: 'eiv/pinterest-fetcher' },
  // 抖音:downloader 主(返回 thumbnail 字段,有封面图);transcripts 备(返回 audioUrl 但无 thumbnail)
  'douyin.com':       { mode: 'apify', primary: 'easyapi/douyin-video-downloader', fallback: 'apple_yang/douyin-transcripts-scraper' },
  'v.douyin.com':     { mode: 'apify', primary: 'easyapi/douyin-video-downloader', fallback: 'apple_yang/douyin-transcripts-scraper' },
  'iesdouyin.com':    { mode: 'apify', primary: 'easyapi/douyin-video-downloader', fallback: 'apple_yang/douyin-transcripts-scraper' },
  'xiaohongshu.com':  { mode: 'apify', primary: 'zhorex/rednote-xiaohongshu-scraper' },
  'xhslink.com':      { mode: 'apify', primary: 'zhorex/rednote-xiaohongshu-scraper' },
  'bilibili.com':     { mode: 'apify', primary: 'apple_yang/bilibili-transcripts-scraper', fallback: 'easyapi/bilibili-video-downloader' },
  'b23.tv':           { mode: 'apify', primary: 'apple_yang/bilibili-transcripts-scraper', fallback: 'easyapi/bilibili-video-downloader' },
  'kuaishou.com':     { mode: 'apify', primary: 'natanielsantos/kuaishou-scraper' },
  'v.kuaishou.com':   { mode: 'apify', primary: 'natanielsantos/kuaishou-scraper' },
  // weibo: 没找到接受 single post URL 的 actor(zhorex/weibo 也是按 search/user 抓),m.weibo.cn 是静态 HTML 直接 fetch
  'weibo.com':        { mode: 'html_fetch' },
  'weibo.cn':         { mode: 'html_fetch' },
  // naver blog: blog.naver.com/<userid>/<postid> 是静态 HTML 直接 fetch,所有 naver-blog actor 都是搜索 actor
  'blog.naver.com':   { mode: 'html_fetch' },
  'dailymotion.com':  { mode: 'apify', primary: 'easyapi/dailymotion-video-downloader' },
  'nicovideo.jp':     { mode: 'apify', primary: 'dltik/niconico-scraper', warning: 'low_runs' },
  'allrecipes.com':       { mode: 'html_recipe_jsonld' },
  'food.com':             { mode: 'html_recipe_jsonld' },
  'foodnetwork.com':      { mode: 'html_recipe_jsonld' },
  'cooking.nytimes.com':  { mode: 'html_recipe_jsonld' },
  'bonappetit.com':       { mode: 'html_recipe_jsonld' },
  'seriouseats.com':      { mode: 'html_recipe_jsonld' },
  'kingarthurbaking.com': { mode: 'html_recipe_jsonld' },
  'xiachufang.com':       { mode: 'html_recipe_jsonld' },
  'meishij.net':          { mode: 'html_recipe_jsonld' },
  'cookpad.com':          { mode: 'html_recipe_jsonld' },
  'kurashiru.com':        { mode: 'html_recipe_jsonld' },
  'delishkitchen.tv':     { mode: 'html_recipe_jsonld' },
  'recipe.rakuten.co.jp': { mode: 'html_recipe_jsonld' },
  '10000recipe.com':      { mode: 'html_recipe_jsonld' },
  'haemukja.com':         { mode: 'html_recipe_jsonld' },
  'giallozafferano.it':   { mode: 'html_recipe_jsonld' },
  'lacucinaitaliana.it':  { mode: 'html_recipe_jsonld' },
  'cookaround.com':       { mode: 'html_recipe_jsonld' },
  'marmiton.org':         { mode: 'html_recipe_jsonld' },
  '750g.com':             { mode: 'html_recipe_jsonld' },
  'cuisineactuelle.fr':   { mode: 'html_recipe_jsonld' },
  'recetasgratis.net':    { mode: 'html_recipe_jsonld' },
  'directoalpaladar.com': { mode: 'html_recipe_jsonld' },
  'hogarmania.com':       { mode: 'html_recipe_jsonld' },
  'chefkoch.de':          { mode: 'html_recipe_jsonld' },
  'lecker.de':            { mode: 'html_recipe_jsonld' },
  'christinesrecipes.com':{ mode: 'html_recipe_jsonld' },
  'openrice.com':         { mode: 'html_recipe_jsonld' },
  'icook.tw':             { mode: 'html_recipe_jsonld' },
  'tarladalal.com':       { mode: 'html_recipe_jsonld' },
  'tudogostoso.com.br':   { mode: 'html_recipe_jsonld' },
  'povar.ru':             { mode: 'html_recipe_jsonld' },
  'edimdoma.ru':          { mode: 'html_recipe_jsonld' },
  'zhihu.com':            { mode: 'html_fetch' },
  'zhuanlan.zhihu.com':   { mode: 'html_fetch' },
  'medium.com':           { mode: 'html_fetch' },
  'substack.com':         { mode: 'html_fetch' },
  'mp.weixin.qq.com':     { mode: 'user_input_only' },
  'ptt.cc':               { mode: 'html_fetch_simple' },
};

function stripWww(host: string): string {
  return host.startsWith('www.') ? host.slice(4) : host;
}

function extractUrlFromText(input: string): string | null {
  const m = input.match(/https?:\/\/[^\s)】」"'，。、]+/i);
  return m ? m[0].replace(/[.,;!?]+$/, '') : null;
}

function lookupRoute(hostname: string): { domain: string; route: PlatformRoute } | null {
  const host = stripWww(hostname.toLowerCase());
  if (ROUTES[host]) return { domain: host, route: ROUTES[host] };
  for (const k of Object.keys(ROUTES)) {
    if (host.endsWith('.' + k)) return { domain: k, route: ROUTES[k] };
  }
  return null;
}

// 短链展开:用 GET + iOS UA 让 fetch 自动跟到底,取最终 URL。
// 旧版用 HEAD + 默认 UA — xhslink 等服务对 HEAD 直接 404,导致短链没展开就被丢给 actor。
async function followRedirect(url: string): Promise<string> {
  try {
    const r = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en,zh;q=0.9,ja;q=0.8',
      },
    });
    return r.url || url;
  } catch {
    return url;
  }
}

async function runApifyActor(actorId: string, url: string, apifyKey: string, timeoutSec: number) {
  const cfg = APIFY_ACTORS[actorId];
  // 未注册的 actor 走兜底,但应当在 APIFY_ACTORS 里登记
  const input = cfg ? cfg.buildInput(url) : { startUrls: [{ url }] };
  const apiUrl = `https://api.apify.com/v2/acts/${encodeURIComponent(actorId.replace('/', '~'))}/run-sync-get-dataset-items?token=${apifyKey}&timeout=${timeoutSec}&memory=1024`;
  try {
    const r = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!r.ok) {
      const text = await r.text();
      return { items: [] as unknown[], ok: false, error: `actor ${actorId} HTTP ${r.status}: ${text.slice(0, 300)}` };
    }
    const items = await r.json();
    return { items: Array.isArray(items) ? items : [items], ok: true } as { items: unknown[]; ok: boolean; error?: string };
  } catch (e) {
    return { items: [] as unknown[], ok: false, error: `actor ${actorId} threw: ${(e as Error).message}` };
  }
}

async function callApifyWithFallback(url: string, route: PlatformRoute, apifyKey: string) {
  const actors = [route.primary, route.fallback].filter(Boolean) as string[];
  const errors: string[] = [];
  for (let i = 0; i < actors.length; i++) {
    const cfg = APIFY_ACTORS[actors[i]];
    const timeoutSec = cfg?.timeoutSec ?? (i === 0 ? 80 : 60);
    const r = await runApifyActor(actors[i], url, apifyKey, timeoutSec);
    if (r.ok && r.items.length > 0) {
      const rawText = JSON.stringify(r.items[0], null, 2).slice(0, 12000);
      return { rawText, ok: true, usedActor: actors[i], rawObj: r.items[0] };
    }
    errors.push(r.error ?? `actor ${actors[i]}: no items`);
  }
  return { rawText: '', ok: false, usedActor: actors[actors.length - 1], error: errors.join(' | '), rawObj: null as unknown };
}

/** 尝试从 Apify item 的常见 image 字段提一张封面图 URL,这样可以在 dish row 里提前存一张图,商业上错不了。 */
function guessCoverImage(rawObj: unknown): string | null {
  if (!rawObj || typeof rawObj !== 'object') return null;
  const o = rawObj as Record<string, unknown>;
  const candidates = [
    o.coverUrl, o.cover_url, o.cover, o.thumbnail, o.thumbnailUrl, o.thumbnail_url,
    o.image, o.imageUrl, o.image_url, o.displayUrl, o.display_url,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && /^https?:\/\//.test(c)) return c;
  }
  // easyapi 系列(douyin/bilibili/dailymotion 的 video-downloader)用 result 包裹真实数据
  const result = o.result as Record<string, unknown> | undefined;
  if (result && typeof result === 'object') {
    for (const k of ['thumbnail', 'cover', 'coverUrl', 'image', 'imageUrl']) {
      const v = result[k];
      if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
    }
  }
  // 抖音常见嵌套路径
  const video = o.video as Record<string, unknown> | undefined;
  if (video && typeof video === 'object') {
    const c = video.cover ?? video.coverUrl ?? video.thumbnail;
    if (typeof c === 'string') return c;
  }
  // 小红书
  const note = o.note as Record<string, unknown> | undefined;
  if (note && typeof note === 'object') {
    const imgs = note.imageList as unknown[] | undefined;
    if (Array.isArray(imgs) && imgs.length > 0) {
      const first = imgs[0] as Record<string, unknown> | string;
      if (typeof first === 'string') return first;
      if (typeof first === 'object' && first) {
        const u = (first as Record<string, unknown>).url ?? (first as Record<string, unknown>).urlDefault;
        if (typeof u === 'string') return u;
      }
    }
  }
  // images: [...]
  const imgs = o.images as unknown[] | undefined;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object') {
      const u = (first as Record<string, unknown>).url;
      if (typeof u === 'string') return u;
    }
  }
  return null;
}

function extractJsonLdRecipe(html: string): { recipe: unknown | null; raw: string; ogImage: string | null } {
  const scripts: string[] = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) scripts.push(m[1].trim());
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const ogImage = ogMatch ? ogMatch[1] : null;
  for (const s of scripts) {
    try {
      const parsed = JSON.parse(s);
      const items = Array.isArray(parsed) ? parsed : [parsed];
      for (const item of items) {
        const types = ([] as unknown[])
          .concat(item['@type'] ?? [])
          .concat((item['@graph'] ?? []).flatMap((g: any) => [g['@type']]));
        if (types.some((t) => typeof t === 'string' && t.toLowerCase().includes('recipe'))) {
          if (typeof item['@type'] === 'string' && item['@type'].toLowerCase().includes('recipe')) return { recipe: item, raw: s.slice(0, 8000), ogImage };
          if (Array.isArray(item['@graph'])) {
            const r = item['@graph'].find((g: any) => typeof g['@type'] === 'string' && g['@type'].toLowerCase().includes('recipe'));
            if (r) return { recipe: r, raw: JSON.stringify(r).slice(0, 8000), ogImage };
          }
        }
      }
    } catch {}
  }
  return { recipe: null, raw: '', ogImage };
}

async function fetchHtml(url: string): Promise<string> {
  const r = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9',
      'Accept-Language': 'en,zh;q=0.9,ja;q=0.8',
    },
  });
  return await r.text();
}

async function extractRecipeJsonLd(url: string) {
  try {
    const html = await fetchHtml(url);
    const { recipe, raw, ogImage } = extractJsonLdRecipe(html);
    if (recipe) return { rawText: raw, ok: true, ogImage };
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 8000);
    return { rawText: `Title: ${titleMatch?.[1] ?? ''}\n\nText (no JSON-LD found):\n${stripped}`, ok: stripped.length > 200, ogImage };
  } catch {
    return { rawText: '', ok: false, ogImage: null as string | null };
  }
}

async function extractGenericHtml(url: string) {
  try {
    const html = await fetchHtml(url);
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
    const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 10000);
    return { rawText: `Title: ${titleMatch?.[1] ?? ''}\n\nMain text:\n${stripped}`, ok: stripped.length > 100, ogImage: ogMatch ? ogMatch[1] : null };
  } catch {
    return { rawText: '', ok: false, ogImage: null as string | null };
  }
}

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const RECIPE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    name_en: { type: 'STRING' },
    description: { type: 'STRING' },
    cuisine: { type: 'STRING', description: '菜系,如 日料 / 湘菜 / 川菜 / 粉面 / 调酒 / 咨喱 / 西餐 / 东南亚 / 意大利菜 等' },
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: { type: 'STRING' }, quantity: { type: 'STRING' }, note: { type: 'STRING' } },
      },
    },
    prep_steps: {
      type: 'ARRAY',
      description: '备菜步骤 (mise en place):预处理,不包含烹饪本身',
      items: {
        type: 'OBJECT',
        properties: { order: { type: 'INTEGER' }, instruction: { type: 'STRING' }, duration_min: { type: 'INTEGER' }, tip: { type: 'STRING' } },
      },
    },
    cook_steps: {
      type: 'ARRAY',
      description: '烹饪步骤:上火之后的正式操作',
      items: {
        type: 'OBJECT',
        properties: { order: { type: 'INTEGER' }, instruction: { type: 'STRING' }, duration_min: { type: 'INTEGER' }, tip: { type: 'STRING' } },
      },
    },
    tools: { type: 'ARRAY', items: { type: 'STRING' }, description: '需要的工具:平底锅 / 微波炉 / 菜刀 / 温计 等' },
    tags: { type: 'ARRAY', items: { type: 'STRING' }, description: '标签:快手菜 / 下饭菜 / 家常菜 / 饭店同款 等' },
    total_time_min: { type: 'INTEGER' },
    servings: { type: 'INTEGER', description: '人份数。除非源明确提到具体份数或是单人食,否则默认偶数(2 或 4),不要给 3/5/7 这种奇数。' },
    calories: { type: 'INTEGER', description: '一人份的大致热量 (千卡)' },
    nutrition: {
      type: 'OBJECT',
      description: '一人份的营养估计 (克)',
      properties: { protein_g: { type: 'NUMBER' }, fat_g: { type: 'NUMBER' }, carbs_g: { type: 'NUMBER' }, fiber_g: { type: 'NUMBER' } },
    },
    difficulty: { type: 'STRING', enum: ['easy', 'medium', 'hard'] },
    confidence: { type: 'STRING', enum: ['high', 'medium', 'low'] },
  },
  required: ['name', 'description', 'ingredients', 'cook_steps', 'confidence'],
};

const SYSTEM_PROMPT = `You are a recipe extractor. Extract a complete, accurate recipe from the provided social media / recipe-site content.

Rules:
- Output language follows the source: Chinese in → Chinese out; English/Japanese/Korean/Italian/French/Spanish in → same out. Use "name_en" for transliteration if non-English.
- If JSON-LD Recipe data is present, treat it as authoritative ground truth.
- Split steps into prep_steps (mise en place: chopping, marinating, prepping) vs cook_steps (active cooking on heat).
- Each step needs a clear instruction; estimate duration_min if reasonable; add tip if there's a notable trick mentioned.
- Tools list: kitchen equipment needed (微波炉 平底锅 etc).
- Tags: descriptors like 快手菜 下饭菜 家常菜, max 4-5.
- Estimate total_time_min, calories (per serving), nutrition (per serving in grams).
- Servings 估计规则(重要):
  · 源里明确写"X 人份"/"做 X 个"/"X serves" → 直接用源给的数字
  · 源里明确暗示单人(便当/一人食/独食/晚餐自己吃) → servings = 1
  · 其他所有情况 → 默认偶数 2 或 4。简单家常菜/快手菜/小炒/小食 → 2;大菜/汤煲/一锅出/聚餐菜/年夜饭 → 4
  · 严禁给 3/5/7 这种奇数,除非源明确标注
- 'difficulty' = easy / medium / hard.
- 'confidence' = high if explicit recipe found, medium if reconstructed from partial signals, low if mostly inferred.
- Cuisine examples: 日料 / 湘菜 / 川菜 / 粉面 / 咨喱 / 调酒 / 意大利菜 / 西餐 / 东南亚 / 韩式 / 粉面 / 火锅 ...
- Return valid JSON ONLY.`;

async function geminiExtractRecipe(
  signals: { sourceUrl: string; platform: string; rawText?: string; images?: string[]; youtubeUrl?: string },
  geminiKey: string,
): Promise<unknown> {
  type Part = { text?: string; inline_data?: { mime_type: string; data: string }; file_data?: { file_uri: string; mime_type: string } };
  const parts: Part[] = [];
  parts.push({ text: SYSTEM_PROMPT });
  parts.push({ text: `Source URL: ${signals.sourceUrl}\nPlatform: ${signals.platform}\n` });
  if (signals.rawText) parts.push({ text: `\n[Extracted content]\n${signals.rawText}\n` });
  if (signals.youtubeUrl) parts.push({ file_data: { file_uri: signals.youtubeUrl, mime_type: 'video/*' } });
  if (signals.images && signals.images.length > 0) {
    for (const imgUrl of signals.images.slice(0, 6)) {
      try {
        const r = await fetch(imgUrl);
        if (!r.ok) continue;
        const ct = r.headers.get('content-type') ?? 'image/jpeg';
        const buf = new Uint8Array(await r.arrayBuffer());
        let bin = '';
        for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
        parts.push({ inline_data: { mime_type: ct, data: btoa(bin) } });
      } catch {}
    }
  }
  const body = {
    contents: [{ parts }],
    generationConfig: {
      response_mime_type: 'application/json',
      response_schema: RECIPE_SCHEMA,
      temperature: 0.3,
    },
  };
  const resp = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`Gemini HTTP ${resp.status}: ${(await resp.text()).slice(0, 500)}`);
  const data = await resp.json();
  if (data.error) throw new Error(`Gemini error: ${JSON.stringify(data.error)}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return JSON.parse(text);
}

function jsonResponse(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

interface ExtractRequest {
  dish_id?: string;
  url?: string;
  text?: string;
  imageBase64?: string;
  imageMimeType?: string;
}

interface RecipeOut {
  name?: string;
  description?: string;
  cuisine?: string;
  ingredients?: Array<{ name: string; quantity?: string; note?: string }>;
  prep_steps?: Array<{ order: number; instruction: string; duration_min?: number; tip?: string }>;
  cook_steps?: Array<{ order: number; instruction: string; duration_min?: number; tip?: string }>;
  tools?: string[];
  tags?: string[];
  total_time_min?: number;
  servings?: number;
  calories?: number;
  nutrition?: { protein_g?: number; fat_g?: number; carbs_g?: number; fiber_g?: number };
  difficulty?: 'easy' | 'medium' | 'hard';
  confidence?: 'high' | 'medium' | 'low';
}

function recipeToText(r: RecipeOut): string {
  const lines: string[] = [];
  if (r.prep_steps && r.prep_steps.length) {
    lines.push('【备菜】');
    for (const s of r.prep_steps.sort((a, b) => a.order - b.order)) {
      lines.push(`${s.order}. ${s.instruction}${s.tip ? ` (💡 ${s.tip})` : ''}`);
    }
  }
  if (r.cook_steps && r.cook_steps.length) {
    lines.push('【烹饪】');
    for (const s of r.cook_steps.sort((a, b) => a.order - b.order)) {
      lines.push(`${s.order}. ${s.instruction}${s.tip ? ` (💡 ${s.tip})` : ''}`);
    }
  }
  return lines.join('\n');
}

async function updateDishStage(
  admin: ReturnType<typeof createClient>,
  dishId: string,
  stage: string | null,
  patch: Record<string, unknown> = {},
): Promise<void> {
  await admin.from('dishes').update({ extract_stage: stage, ...patch }).eq('id', dishId);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' });
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return jsonResponse(401, { error: 'Unauthorized' });
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) return jsonResponse(500, { error: 'Server config missing' });
  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: userData, error: authErr } = await userClient.auth.getUser();
  if (authErr || !userData.user) return jsonResponse(401, { error: 'Unauthorized' });
  const [{ data: geminiKey }, { data: apifyKey }] = await Promise.all([
    adminClient.rpc('get_gemini_api_key'),
    adminClient.rpc('get_apify_api_key'),
  ]);
  if (!geminiKey || typeof geminiKey !== 'string') return jsonResponse(500, { error: 'Vault: GEMINI_API_KEY missing' });
  if (!apifyKey || typeof apifyKey !== 'string') return jsonResponse(500, { error: 'Vault: APIFY_API_KEY missing' });

  let body: ExtractRequest;
  try { body = (await req.json()) as ExtractRequest; }
  catch { return jsonResponse(400, { error: 'Invalid JSON' }); }

  const dishId = body.dish_id;
  if (!dishId) return jsonResponse(400, { error: 'Missing dish_id' });

  // Verify caller is the chef of this dish
  const { data: dishRow, error: dishErr } = await userClient
    .from('dishes')
    .select('id, group_id, menu_groups!inner(chef_id)')
    .eq('id', dishId)
    .single();
  if (dishErr || !dishRow) return jsonResponse(404, { error: 'Dish not found or no permission' });

  /** Helper: 最终 commit dish row 并返回响应 */
  const commitFinal = async (recipe: RecipeOut, sourceMeta: { mode: string; platform?: string; actor?: string }, imageHint?: string | null) => {
    const update: Record<string, unknown> = {
      extract_status: null,
      extract_stage: null,
      extract_error: null,
      source_platform: sourceMeta.platform ?? sourceMeta.mode,
    };
    if (recipe.name) update.name = recipe.name;
    if (recipe.description !== undefined) update.description = recipe.description ?? null;
    if (recipe.cuisine) update.cuisine = recipe.cuisine;
    if (recipe.ingredients) update.ingredients = recipe.ingredients;
    if (recipe.prep_steps) update.prep_steps = recipe.prep_steps;
    if (recipe.cook_steps) update.cook_steps = recipe.cook_steps;
    if (recipe.tools) update.tools = recipe.tools;
    if (recipe.tags) update.tags = recipe.tags;
    if (recipe.total_time_min !== undefined) update.total_time_min = recipe.total_time_min;
    if (recipe.servings !== undefined) update.servings = recipe.servings;
    if (recipe.calories !== undefined) update.calories = recipe.calories;
    if (recipe.nutrition) update.nutrition = recipe.nutrition;
    if (recipe.difficulty) update.difficulty = recipe.difficulty;
    if (recipe.cook_steps && recipe.cook_steps.length) update.recipe = recipeToText(recipe);
    if (imageHint) update.image_url = imageHint;
    await adminClient.from('dishes').update(update).eq('id', dishId);
    return jsonResponse(200, { ok: true, dish_id: dishId });
  };

  /** Helper: mark error */
  const commitError = async (msg: string) => {
    await adminClient.from('dishes').update({
      extract_status: 'error',
      extract_stage: null,
      extract_error: msg.slice(0, 500),
    }).eq('id', dishId);
    return jsonResponse(200, { ok: false, error: msg.slice(0, 500), dish_id: dishId });
  };

  // --- Branch by input ---
  try {
    if (body.text && !body.url && !body.imageBase64) {
      await updateDishStage(adminClient, dishId, 'integrating');
      const recipe = await geminiExtractRecipe({ sourceUrl: 'user_input', platform: 'text', rawText: body.text }, geminiKey) as RecipeOut;
      return await commitFinal(recipe, { mode: 'text' });
    }
    if (body.imageBase64 && !body.url) {
      await updateDishStage(adminClient, dishId, 'integrating');
      const parts = [
        { text: SYSTEM_PROMPT },
        { text: `Source: user-uploaded image.\n` },
        { inline_data: { mime_type: body.imageMimeType ?? 'image/jpeg', data: body.imageBase64 } },
      ];
      const resp = await fetch(`${GEMINI_ENDPOINT}?key=${geminiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts }], generationConfig: { response_mime_type: 'application/json', response_schema: RECIPE_SCHEMA, temperature: 0.3 } }),
      });
      if (!resp.ok) throw new Error((await resp.text()).slice(0, 500));
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const recipe = JSON.parse(text) as RecipeOut;
      return await commitFinal(recipe, { mode: 'image' });
    }
    if (!body.url) return await commitError('Provide url, text, or imageBase64');

    const rawInput = body.url.trim();
    const extracted = extractUrlFromText(rawInput);
    let url = extracted ?? rawInput;

    await updateDishStage(adminClient, dishId, 'fetching', { source_url: url });

    try {
      const u = new URL(url);
      const host = stripWww(u.hostname.toLowerCase());
      const SHORT_LINKS = new Set(['b23.tv', 'youtu.be', 'fb.watch', 'pin.it', 'v.douyin.com', 'iesdouyin.com', 'xhslink.com', 'vm.tiktok.com', 'vt.tiktok.com', 't.co']);
      if (SHORT_LINKS.has(host)) url = await followRedirect(url);
    } catch {
      return await commitError(`Invalid URL: ${rawInput.slice(0, 200)}`);
    }

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch { return await commitError(`Invalid URL after redirect: ${url}`); }
    const lookup = lookupRoute(parsedUrl.hostname);
    const route: PlatformRoute = lookup?.route ?? { mode: 'html_recipe_jsonld' };
    const platform = lookup?.domain ?? 'unknown';

    if (route.mode === 'native_gemini') {
      await updateDishStage(adminClient, dishId, 'integrating', { source_url: url });
      const recipe = await geminiExtractRecipe({ sourceUrl: url, platform, youtubeUrl: url }, geminiKey) as RecipeOut;
      return await commitFinal(recipe, { mode: 'native_gemini', platform });
    }
    if (route.mode === 'html_recipe_jsonld') {
      const ex = await extractRecipeJsonLd(url);
      if (!ex.ok) return await commitError('Could not extract HTML/JSON-LD');
      if (ex.ogImage) await adminClient.from('dishes').update({ image_url: ex.ogImage }).eq('id', dishId);
      await updateDishStage(adminClient, dishId, 'integrating');
      const recipe = await geminiExtractRecipe({ sourceUrl: url, platform, rawText: ex.rawText }, geminiKey) as RecipeOut;
      return await commitFinal(recipe, { mode: 'html_recipe_jsonld', platform }, ex.ogImage);
    }
    if (route.mode === 'html_fetch' || route.mode === 'html_fetch_simple') {
      const ex = await extractGenericHtml(url);
      if (!ex.ok) return await commitError('Could not fetch HTML');
      if (ex.ogImage) await adminClient.from('dishes').update({ image_url: ex.ogImage }).eq('id', dishId);
      await updateDishStage(adminClient, dishId, 'integrating');
      const recipe = await geminiExtractRecipe({ sourceUrl: url, platform, rawText: ex.rawText }, geminiKey) as RecipeOut;
      return await commitFinal(recipe, { mode: route.mode, platform }, ex.ogImage);
    }
    if (route.mode === 'user_input_only') {
      return await commitError('closed_platform: 该平台无法直接抓取,请截图或复制内容粘贴');
    }
    if (route.mode === 'apify' && route.primary) {
      const apifyResult = await callApifyWithFallback(url, route, apifyKey);
      if (!apifyResult.ok) return await commitError(`apify_failed: ${apifyResult.error ?? 'unknown'}`);
      // 数据已抓到 → 标 'extracted'(让 client 进度条跳一段,提示"准备 AI 整理")
      await updateDishStage(adminClient, dishId, 'extracted');
      const cover = guessCoverImage(apifyResult.rawObj);
      if (cover) await adminClient.from('dishes').update({ image_url: cover }).eq('id', dishId);
      await updateDishStage(adminClient, dishId, 'integrating');
      const recipe = await geminiExtractRecipe({ sourceUrl: url, platform, rawText: apifyResult.rawText }, geminiKey) as RecipeOut;
      return await commitFinal(recipe, { mode: 'apify', platform, actor: apifyResult.usedActor }, cover);
    }
    return await commitError('No route matched');
  } catch (e) {
    return await commitError((e as Error).message);
  }
});
