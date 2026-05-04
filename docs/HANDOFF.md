# Carte 项目 Handoff(原 2026-05-01,更新 2026-05-04)

> 这份文档原本是 2026-05-01 由 Claude Desktop App 写的衔接说明。**2026-05-04 在 VS Code 里完成了大规模 Vite→RN 像素移植**,大部分 §4.1 的 P0 已经做完。**先看下面 §0a 的 5/4 增量,再读原文**(原文中 §2、§4、§5 大段已被超越)。

---

## 0a. 2026-05-04 更新(supersedes parts of §0/§2/§4)

**当前 commit 链**(每条独立可回滚):
- `3154268` feat(ui): port all sheets/cards/components to sketch UI + supporting hooks(37 文件)
- `6e4a439` feat(ui): pixel-port all 7 screens from Vite prototype(9 文件)
- `4455fd2` feat(ui): sketch primitives + ink palette + responsive utils(16 文件)
- `071c6aa` ← 5/1 那次,handoff.md 写在这

**5/4 实际做完的(原 §4.1 P0 几乎全部)**:
- ✅ kitchen.tsx 像素重构(carte 卡 / FAB / 子区 pill / 顶部 SketchUnderline)
- ✅ dish/[id].tsx 全屏重构(SketchPhoto hero / 份量 stepper / ingredient pills / 步骤行 / 评论)
- ✅ cook/[dishId].tsx 烹饪模式(sketch 计时器 + 上一步/下一步 CTA + ingredient token)
- ✅ chef/group/[id].tsx 主体(分类 chip + 菜品 grid + FAB + header 预览 pill)
- ✅ diner/group/[id].tsx 主体(category sidebar with sidebarStyle() + dish list + cart FAB + ?preview banner)
- ✅ 所有 13 个 sheet 内部按钮换 sketch 包裹
- ✅ Button/Input/Sheet/EmptyState/ConfirmDialog 全部底层换 sketch
- ✅ Sidebar 字号自适应公式 — `sidebarStyle()` 已实现于 `app/diner/group/[id].tsx:32`
- ✅ 5 张老 chef/diner 卡片删除(MenuGroupCard / PendingOrdersCard / RecentCommentsCard / WeeklyWishlistCard / KitchenCard)— 内联到新屏幕里
- ✅ 多机型适配 — `lib/responsive.ts` 提供 `useResponsive()` hook(SE/mini/regular/large/tablet 5 档)
- ✅ 字体层次最终答案(见下面新决策 #14、#15)
- ✅ Jitter 收紧 — `soft 1.8→1.2 / mid 2.8→2.2 / strong 4.5→3.6`(iOS 3x DPI 校准过的值)

**5/4 新增基础设施(原 §5 没列的)**:
- `lib/palette.ts` — navy ink 调色板 + 字体角色定义 + 中文 fallback 注释
- `lib/responsive.ts` — `useResponsive()` 多机型适配
- `components/ui/SketchBottomTabs.tsx` — 自定义底部 tab(替代 Expo Router 默认 tab)
- `components/ui/Tappable.tsx` — press/lift 反馈 wrapper(对应 Vite Tappable)
- `components/ui/sketch/SketchPhoto.tsx` + `SketchPhotoCircle` — 图片 + 手绘外框

**5/4 新增设计决策(原 §3 锁定的 13 条之外,加 2 条)**:

| # | 决策 | 出处 |
|---|---|---|
| 14 | **像素级移植**:Vite 的 padding/fontSize/radius/seed/color **逐字搬,不再"基于设计意图自由发挥"** | b0760ff0 session 用户原话 "我不想让你视觉分析后再根据自己的理解给我重新做一版" |
| 15 | **字体**:Latin (Caveat/Fraunces) + 中文 **fallback PingFang**。**不要给中文强加手写体**(ZCOOL/MaShan/LongCang 都试过,看着脏) | b0760ff0 收尾,Figma 截图证据 |

**还没做的(以 5/4 为基线)**:
- 🔲 `useAiQuota` 接真 Supabase RPC(目前 mock `{used:3, limit:8}`)
- 🔲 拍照识别接 Gemini/OpenAI Vision(目前 toast "即将上线")
- 🔲 Pro 升级接 RevenueCat / Apple IAP(目前 toast 占位)
- 🔲 share 域名换真值(等买到 carte.app 真域名)
- 🔲 P2 prebuild 后:iOS ShareExtension / LiveActivity Path B / WeChat SDK / Diner 烹饪 LiveActivity

---

## 0. 现状一句话(原 5/1)

**RN App 第一波结构性改动落地 + 通过 typecheck**,但**手绘视觉样式只覆盖了新增/重构的屏幕**(后厨 / AddDishSheet / AILimitSheet / Profile AI 块 / chef 预览按钮 / diner 预览 banner)。其他屏幕的 border 还是旧的灰线,需要分批迁到 SketchBox。

> ⚠️ 5/4 已大幅推进,见 §0a。这一段保留作历史记录。

---

## 1. 启动 / 联调

```bash
cd /Users/tanghaoran/Carte
npx expo start --lan        # 不需要再 --clear,cache 已重建过
```

QR 码会出现在你的 VS Code 终端窗口。手机端 Expo Go 扫码。

**已知前置**:
- `expo-speech` 和 `expo-notifications` 已 `npx expo install`,本次会话装的
- `react-native-svg 15.12.1` 已在,不用动
- `twrnc 4.16.0` 已在

---

## 2. 本次会话改动清单

### 2.1 RN 新增文件

| 文件 | 作用 |
|---|---|
| `components/ui/sketch/handPath.ts` | 手绘路径算法(SVG cubic-bezier,长边自动多段,jitter 按尺寸放大) |
| `components/ui/sketch/HandPathBorder.tsx` | 绝对定位 SVG 边框,用 `onLayout` 测尺寸 |
| `components/ui/sketch/SketchBox.tsx` | 带手绘描边的矩形容器 |
| `components/ui/sketch/SketchPill.tsx` | 手绘 pill,可选 active 双线 |
| `components/ui/sketch/SketchCircle.tsx` | 圆形(**几何完美,不抖**,设计 call) |
| `components/ui/sketch/SketchUnderline.tsx` | 标题下面的波浪线 |
| `components/ui/sketch/index.ts` | barrel export |
| `hooks/chef/useChefOrderHistory.ts` | 已完成/取消订单查询(后厨"历史" tab 用) |
| `hooks/useAiQuota.ts` | **mock**,返回 `{used: 3, limit: 8}`。**TODO:接 Supabase RPC** |
| `components/chef/AILimitSheet.tsx` | AI 上限弹窗,温和、给手动 fallback |

### 2.2 RN 重写/修改文件

| 文件 | 改动 |
|---|---|
| `app/(tabs)/orders.tsx` | **完全重构** → "后厨" 标题 + 4 子区(订单/愿望/反馈/历史)+ carte 筛选 chip。用真实 hooks 串数据 |
| `components/chef/AddDishMethodSheet.tsx` | 2 选项 → **3 选项**(AI/拍照/手动),用 SketchBox 包,**无配额文字** |
| `app/profile/edit.tsx` | 加 "AI 用量" 卡片 + 进度条 + Pro 升级入口(目前 toast 占位) |
| `app/chef/group/[id].tsx` | header 右侧加 "**预览**" pill → 跳到 diner 视图带 `?preview=1`;FAB 触发 AI 时检查 quota,溢出弹 AILimitSheet |
| `app/diner/group/[id].tsx` | 接收 `?preview=1` 显示虚线 banner "👁 以 diner 视角预览" |
| `i18n/zh.json` | `"activeOrders": "活跃订单"` → `"后厨"`;`"noActiveOrders"` 文案微调 |
| `i18n/en.json` | `"Active Orders"` → `"Studio"`(英文用 Studio 比 Backstage 更短) |
| `package.json` | 加 `expo-speech` + `expo-notifications` |

### 2.3 Vite 原型同步改动(仅供视觉参考)

路径: `/Users/tanghaoran/Downloads/UI Redesign Brief new/`

启动: `cd "/Users/tanghaoran/Downloads/UI Redesign Brief new" && npm run dev` → http://localhost:5173

| 文件 | 改动 |
|---|---|
| `src/app/components/Sketch.tsx` | 手绘改用 SVG 路径(不再用 feDisplacementMap 滤镜),修了 pill 形 radius 越界 bug |
| `src/app/components/AppRouter.tsx` | 加 `dynamicSection` / `dynamicCarteFilter` / `viewAsDiner` / `aiUsed` / `aiLimit` 状态;sheet 加 `addDish` / `aiLimit` |
| `src/app/components/OrdersScreen.tsx` | "活跃订单" → "后厨" 4 子区 |
| `src/app/components/KitchenScreen.tsx` | 底部 tab "Orders" → "后厨",pill 间距修复 |
| `src/app/components/DinerCarteScreen.tsx` | sidebar 字号自适应函数;viewAsDiner banner |
| `src/app/components/ChefCarteScreen.tsx` | header 加 "预览" pill;FAB → 触发 AddDishSheet |
| `src/app/components/ProfileScreen.tsx` | AI 用量 block + Pro 入口 |
| `src/app/components/SheetsScreen.tsx` | 新增 `AddDishSheet`(3 按钮)+ `AILimitSheet` |
| `src/app/components/InteractiveApp.tsx` | wire 新 sheets |

---

## 3. 已对齐的设计决策(**关键 — 不要回头改**)

| # | 决策 | 理由 / 出处 |
|---|---|---|
| 1 | **手绘 = SVG path,不是 CSS filter** | filter 看上去是分段拼线 + 像素感;path 是连续曲线,长边多段 cubic + jitter 自动按尺寸放大 |
| 2 | **`soft` jitter = 1.8 是全局默认** | 兼顾"明显手绘"和"不至于看起来歪" |
| 3 | **圆形按键不上手绘** | 视觉上圆形扭一下反而难看;圆永远几何完美 |
| 4 | **后厨 = 4 子区**(订单/愿望/反馈/历史)+ **carte 筛选 chip** | 替代原来的 incoming/outgoing 二元切换,把分散的 chef 视图集中到一个 hub |
| 5 | **上传 = 3 等大按钮**(AI / 拍照 / 手动),**无配额文字** | 配额过于商业,破坏氛围;只在资料页 + 触达上限弹窗显示 |
| 6 | **AI 配额 = 8 次/月免费**(mock) | freemium tier 起点;后续接真实 RPC |
| 7 | **触达 AI 上限弹温和提示**,**给手动 fallback** | 不让用户卡死;升级 Pro 是次要 CTA |
| 8 | **公开评论时间线**(route 1) | 私域内不会有恶意评论;公开能积累记忆;之前讨论过 DM / 私笔记两个备选,user 选了 1 |
| 9 | **chef/diner 视图按 carte 所有权自动切换** | 不要全局模式 toggle;chef 看自己的 carte 进 chef 视图,看别人的进 diner 视图 |
| 10 | **chef 端给"以 diner 视角预览"按钮** | 让 chef 不离开自己 carte 也能看上线后效果 |
| 11 | **Sidebar 分类 ≤ 10 字硬限,字号自适应** | 公式见 `Vite/DinerCarteScreen.tsx` 里的 `sidebarStyle()` — RN 还没实现,**需要补** |
| 12 | **底部 tab "Kitchen" 暂不改**,留到最后一期看是否换"前厅" | 品牌词,改掉前需要更多对齐 |
| 13 | **share 卡片域名**用占位 `https://carte.app`,等买真域名再改 `lib/share.ts` 一处 | 上一会话决定 |

---

## 4. 待办清单(按优先级)

### 4.1 P0 — 视觉一致性(立刻能做,不需 prebuild)

把 Sketch 原语推到剩下的屏幕:

- [ ] **`app/(tabs)/kitchen.tsx`** — carte 卡片 / FAB 圆 / 底部 tab pill / pendingOrdersCard / weeklyWishlistCard / recentCommentsCard 全部改用 `SketchBox` / `SketchCircle` / `SketchPill`
- [ ] **`app/dish/[id].tsx`**(DishDetailScreen)— 主按钮(开始做菜 / 加入购物车 / 分享)、份量步进器
- [ ] **`app/cook/[dishId].tsx`**(CookingScreen)— 步骤框、计时器 pill、上一步/下一步 CTA
- [ ] **`app/chef/group/[id].tsx`** — 我们改了 header(预览按钮),body 里的菜品卡 / 分类 chip / FAB 添加菜品按钮还是旧线条
- [ ] **`app/diner/group/[id].tsx`** — 我们改了 banner,主体菜品卡 / 分类区 / 购物车 FAB 还旧
- [ ] **所有 sheet**(`components/chef/CategorySheet.tsx`、`MenuGroupSheet.tsx`、`SmartFillSheet.tsx`、`DishSheet.tsx`、`components/diner/CartSheet.tsx`)— 内部按钮
- [ ] **`components/ui/Button.tsx`** — 通用 button 也要换;改一处全局升级,但要小心兼容性

**用法速查**(每个新 sketch 元素都要给唯一 `seed`):
```tsx
<SketchBox seed={3} radius={14} style={tw`p-4`}>...</SketchBox>
<SketchPill seed={5} active={isActive} onPress={...}>Label</SketchPill>
<SketchCircle size={40} onPress={...}><Icon /></SketchCircle>
```

### 4.2 P0 — Sidebar 字号自适应(RN 缺)

Vite 已经有 `sidebarStyle(names)` 函数(`Downloads/UI Redesign Brief new/src/app/components/DinerCarteScreen.tsx`),RN 没移植。

规则:
```ts
maxLen ≤ 3 → fontSize 18, 1 行
maxLen 4   → fontSize 16, 1 行
maxLen 5   → fontSize 13, 1 行
maxLen 6-8 → fontSize 14, 2 行
maxLen 9-10→ fontSize 13, 2 行
```

CategorySheet 加 `maxLength={10}` + 错误提示 "分类名最多 10 个字"。

### 4.3 P1 — Mock 替换(等后端就绪)

| Mock | 位置 | 替换为 |
|---|---|---|
| `useAiQuota` 写死 `3/8` | `hooks/useAiQuota.ts:16-17` | Supabase RPC,统计当月 `extract-recipe` 调用次数 |
| 拍照识别 toast "即将上线" | `components/chef/AddDishMethodSheet.tsx` `onPhoto` | 真实 image-OCR 流(Gemini Vision 或 OpenAI vision) |
| 升级 Pro toast | `app/profile/edit.tsx`、`AILimitSheet.tsx` | RevenueCat / Apple IAP |
| share 域名 `https://carte.app` | `lib/share.ts` | 买到真域名后改一处 |

### 4.4 P1 — 字体(影响整体氛围)

当前 RN 用 Inter(无衬线)+ Fraunces(衬线)。Vite 原型用 Caveat/Kalam(英文手写体)— 这两个字体**不渲染中文**。

中文手写体候选(都开源/可商用):
- **Liu Jian Mao Cao**(刘建毛草)— Google Fonts 已上,毛笔感
- **Long Cang**(龙藏)— 流畅手写
- **ZCOOL XiaoWei**(站酷小薇)— 圆润中文体

**TODO**: `app/_layout.tsx` 加 `useFonts` 加载,然后定义一个 `handFont` 常量给标题/品牌字用。

### 4.5 P2 — 待 prebuild(需要 EAS Build,Expo Go 跑不了)

- [ ] ShareExtension(iOS 分享到 App)
- [ ] LiveActivity Path B(chef 订单灵动岛 — 当前用 Path A 本地通知够用)
- [ ] WeChat SDK + 微信小程序 MVP
- [ ] Diner 烹饪 LiveActivity(deferred)

⚠️ 这一组一旦动需要 `npx expo prebuild`,之后**只能用 dev client / TestFlight 跑,Expo Go 跑不了**。所以建议:
- **Expo Go 阶段把 P0/P1 都打磨完**,再一次性 prebuild 进入 P2

---

## 5. 关键文件索引

### 5.1 新原语库(用这个,不要再从 0 写)
```
components/ui/sketch/
├── handPath.ts          ← 算法,核心是 buildHandPath()
├── HandPathBorder.tsx   ← 绝对定位的 SVG 边框
├── SketchBox.tsx        ← 矩形容器
├── SketchPill.tsx       ← 圆角 pill
├── SketchCircle.tsx     ← 圆(几何完美)
├── SketchUnderline.tsx  ← 标题波浪线
└── index.ts
```

### 5.2 新 hooks
```
hooks/
├── useAiQuota.ts                    ← mock,等接真后端
└── chef/useChefOrderHistory.ts      ← 已完成订单
```

### 5.3 改过的页面
```
app/(tabs)/orders.tsx            ← 后厨 4 子区
app/profile/edit.tsx             ← AI 用量块
app/chef/group/[id].tsx          ← 预览按钮 + AILimit 触发
app/diner/group/[id].tsx         ← 预览 banner
```

### 5.4 改过的组件
```
components/chef/AddDishMethodSheet.tsx   ← 3 按钮版
components/chef/AILimitSheet.tsx         ← 新增
```

### 5.5 i18n
```
i18n/zh.json    chef.activeOrders = "后厨"
i18n/en.json    chef.activeOrders = "Studio"
```

### 5.6 视觉参考(Vite 原型)
```
/Users/tanghaoran/Downloads/UI Redesign Brief new/
  src/app/components/*.tsx     ← 各屏的视觉原型
  npm run dev                  ← localhost:5173
```

---

## 6. 上下文 / 历史:之前会话做的

为了完整性,粗略列一下**本次会话之前**已做的功能(可能你看到代码会觉得"这是啥时候加的"):

- **AI 抽取重写 v9-v10**:Apify 21 actor 全验证 + 修了 14 个错配置。SYSTEM_PROMPT 富菜谱字段(servings 偶数偏好、calorie、tags 等)
- **份量步进 + 食材按比缩放**:`app/dish/[id].tsx` 顶部份量 stepper,食材数量按 `displayServings / sourceServings` 缩放
- **食材 token bottom sheet**:点食材弹底部抽屉显示详情(`components/dish/IngredientSheet.tsx`)
- **食材别名归一化**:`lib/units.ts` 的 `INGREDIENT_ALIAS_GROUPS`(50+ 中文别名组,番茄=西红柿,土豆=洋芋=马铃薯)
- **烹饪模式 Path B**:全屏分步、TTS、计时器(`app/cook/[dishId].tsx` — 这个就是刚才报错缺包的那个)
- **分享按钮**:`lib/share.ts` 中心化,占位域名
- **Chef 主页 3 张卡**:[PendingOrdersCard](../components/chef/PendingOrdersCard.tsx) / [WeeklyWishlistCard](../components/chef/WeeklyWishlistCard.tsx) / [RecentCommentsCard](../components/chef/RecentCommentsCard.tsx)
- **Realtime 订单**:[useRealtimeOrders](../hooks/realtime/useRealtimeOrders.ts) + 本地通知
- **CLAUDE.md** 写入了 Apify actor 添加流程,防止后续 agent 重复犯错

**项目 CLAUDE.md** 在 [`/Users/tanghaoran/Carte/CLAUDE.md`](../CLAUDE.md),包含 Apify 强制流程 + 代码风格规范。**新人/新会话进来一定先读它**。

---

## 7. 冒烟测试清单(改完代码必走一遍)

### 7.1 后厨 tab
- [ ] 底部点击 "后厨" → 打开 4 子区(订单/愿望/反馈/历史)+ carte 筛选 chip
- [ ] 切换 4 个子区,每个都加载对应数据
- [ ] 点 carte 筛选 chip,数据按 carte 过滤
- [ ] "全部 carte" chip 默认选中

### 7.2 Add Dish Sheet
- [ ] chef carte 里点 "+ 添加菜品" → 3 按钮 sheet 弹出
- [ ] 点 "AI 智能填充":AI 没用完时进 SmartFill,用完进 AILimitSheet
- [ ] 点 "拍照识别":toast "即将上线"
- [ ] 点 "手动添加":进现有的 DishSheet manual 模式
- [ ] **每张卡片不能有任何配额数字**(过于商业)

### 7.3 Profile AI 用量
- [ ] 头像下面有"AI 用量"卡片
- [ ] 显示 "本月已用 3 / 8" + 进度条
- [ ] 底部有 "Pro →" pill,点弹 toast "升级 Pro 即将上线"

### 7.4 预览模式
- [ ] chef 自己 carte 右上角有 "预览" pill
- [ ] 点击 → 跳到 diner 视图
- [ ] diner 视图顶部有虚线 banner "👁 以 diner 视角预览"
- [ ] 返回回到 chef carte

### 7.5 AILimit Sheet
- [ ] 把 `useAiQuota.ts` 里 `MOCK_USED` 临时改成 `8` → AI 按钮变成上限弹窗
- [ ] 弹窗:"AI 额度用完了" + "本月已用 8 / 8" + 手动 fallback + 升级 Pro CTA
- [ ] 点 "手动添加" → sheet 关 → DishSheet 打开
- [ ] 点 "升级 Pro" → toast 占位

### 7.6 Sketch 视觉
- [ ] 后厨 tab 的 4 子区 pill / carte filter chip 都是手绘弧线
- [ ] AddDishSheet 3 张卡片是手绘描边
- [ ] AILimitSheet 两个 CTA pill 手绘
- [ ] Profile AI 用量卡片手绘

---

## 8. 已知问题 / 注意事项

| 问题 | 状态 |
|---|---|
| `expo-speech` / `expo-notifications` import error | **已修**(本次 `npx expo install`) |
| `supabase/functions/extract-recipe/index.ts` Deno 类型 error | **忽略**,这是 edge function,不是 RN |
| `npm audit` 15 moderate vulnerabilities | 历史遗留,不阻塞 |
| `--clear` 第一次启动慢(60-90s) | 正常,bundler cache 重建 |
| `useChefOrderHistory` 没 realtime,刷新需要 pull-to-refresh | 后续要加 |
| Vite 原型还是分别启动的(Mac 后台留了一个 5173 的 dev server) | 不重要,看视觉用 |

---

## 9. 接续工作的推荐顺序

1. **跑 Expo Go,过 7 节冒烟清单**,确认本次会话改动都跑通
2. **做 P0 视觉迁移**,从 KitchenScreen 开始(这是 user 最常看到的屏)— 1-2 小时
3. **做 P0 Sidebar 字号自适应** — 30 分钟
4. **接真 AI 配额**(`useAiQuota`)— 0.5 天,需要新 Supabase RPC
5. **做 P1 字体**(中文手写体)— 1 小时,但视觉冲击大
6. **P2 prebuild 项一次做完**,然后从 Expo Go 切到 dev client

---

## 10. 紧急联系 / 上下文恢复

- **本会话上下文路径**:`/Users/tanghaoran/.claude/projects/-Users-tanghaoran-pronto-cursor--claude-worktrees-modest-panini-be4017/200d0de2-ff33-47c3-bdac-e7b32ab95abd.jsonl`
- **memory**: `/Users/tanghaoran/.claude/projects/-Users-tanghaoran-pronto-cursor/memory/MEMORY.md`(项目概览、后端架构、导航 — 在新会话开始时自动加载)
- **CLAUDE.md**:`/Users/tanghaoran/Carte/CLAUDE.md`(项目级强制规范)

如果新会话进来不知道现状,这份 HANDOFF.md 是入口。

---

最后更新: 2026-05-01 由 Claude Opus 4.7 写。
