/**
 * 食材别名 + 数字单位 helpers — chef-diner 场景里 chef 可能写"番茄",step 里写"西红柿",
 * UI 都应该高亮匹配。
 *
 * 原则:
 * - 别名表保守(不放"葱""姜"这种短字,容易跟其他词重叠)
 * - 不做跨单位换算(g↔斤),只做数字按 ratio 缩放,保留单位文本
 * - chef 端写什么,diner 看什么 — locale 转换是 nice-to-have,后续考虑
 */

/** 食材别名分组 — 同一行的视为同一食材的不同写法。 */
export const INGREDIENT_ALIAS_GROUPS: string[][] = [
  ['番茄', '西红柿'],
  ['土豆', '洋芋', '马铃薯'],
  ['玉米', '苞米', '玉蜀黍'],
  ['红薯', '地瓜', '番薯', '甘薯'],
  ['卷心菜', '包菜', '圆白菜', '包心菜', '甘蓝'],
  ['白菜', '大白菜'],
  ['菠菜'],
  ['茄子', '矮瓜'],
  ['黄瓜', '青瓜'],
  ['冬瓜'],
  ['南瓜', '倭瓜'],
  ['丝瓜'],
  ['苦瓜', '凉瓜'],
  ['青椒', '甜椒', '柿子椒'],
  ['辣椒', '海椒', '尖椒'],
  ['香菜', '芫荽'],
  ['豆腐'],
  ['豆角', '豇豆', '四季豆', '扁豆'],
  ['鸡蛋', '蛋'],
  ['猪肉'],
  ['五花肉'],
  ['排骨'],
  ['里脊', '里脊肉', '里脊条'],
  ['牛肉'],
  ['牛腩'],
  ['鸡胸', '鸡胸肉'],
  ['鸡腿', '鸡腿肉'],
  ['鸡翅', '鸡翅膀'],
  ['鱼', '鱼肉'],
  ['虾仁', '虾肉'],
  ['大米', '米'],
  ['面条', '面'],
  ['饺子皮'],
  ['馄饨皮'],
  ['酱油', '生抽'],
  ['老抽'],
  ['醋', '米醋', '香醋', '陈醋'],
  ['盐', '食盐'],
  ['白糖', '砂糖', '糖'],
  ['冰糖'],
  ['料酒', '黄酒', '绍兴酒'],
  ['花椒'],
  ['八角', '大料'],
  ['桂皮'],
  ['香叶', '月桂叶'],
  ['豆瓣酱', '郫县豆瓣'],
  ['蚝油'],
  ['食用油', '菜籽油', '花生油', '色拉油', '菜油'],
  ['芝麻油', '香油', '麻油'],
  ['淀粉', '生粉', '玉米淀粉'],
  ['面粉', '中筋面粉'],
  ['酵母', '酵母粉'],
];

/** 反向索引:食材名 → 该名所在的 alias group。未在表里的食材返回单元素数组 [name]。 */
export function getAliases(name: string): string[] {
  if (!name) return [];
  for (const group of INGREDIENT_ALIAS_GROUPS) {
    if (group.includes(name)) return group;
  }
  return [name];
}

/**
 * 按 ratio 缩放食材用量字符串里的数字。
 * 输入: "200g" + ratio=2 → "400g"; "1/2 杯" + ratio=2 → "1 杯"; "少许" → 不变;
 * "半斤"类不识别 → 保留原文。
 *
 * 简化策略:只缩放第一个数字 token,保留单位和前后文。
 */
export function scaleQuantity(quantity: string, ratio: number): string {
  if (!quantity || ratio === 1) return quantity;
  // 先处理分数 "1/2", "3/4"
  const fracMatch = quantity.match(/(\d+)\s*\/\s*(\d+)/);
  if (fracMatch) {
    const num = parseInt(fracMatch[1], 10);
    const den = parseInt(fracMatch[2], 10);
    if (den > 0) {
      const scaled = (num / den) * ratio;
      return quantity.replace(fracMatch[0], formatScaled(scaled));
    }
  }
  // 普通整数/小数
  return quantity.replace(/(\d+(?:\.\d+)?)/, (m) => {
    const n = parseFloat(m);
    if (!Number.isFinite(n)) return m;
    return formatScaled(n * ratio);
  });
}

function formatScaled(n: number): string {
  if (Number.isInteger(n)) return String(n);
  if (n >= 10) return n.toFixed(0);
  if (n >= 1) return (Math.round(n * 10) / 10).toString();
  return (Math.round(n * 100) / 100).toString();
}
