# Carte App — UI 重设计 Brief

> 给 Figma Make / 设计师的产品上下文文档。
>
> **重要使用说明**:
> - 本文档描述的是 **当前 Carte app 的产品结构与字段**,**仅作设计参考**
> - **不必完全照搬现版本** — 视觉、布局、交互细节都可以重做
> - 文档目的:让设计师看到产品全貌(哪些 screen、哪些模块、哪些字段、哪些状态),
>   方便基于业务逻辑重新设计 UI
> - 字段清单来自当前实现,但任何字段都可以增/删/重组
> - 字号、间距、阴影等数值细节本文档不做约束,由设计师按品牌调性决定

---

## 1. 产品定位

**Carte = chef × diner 双边私密菜单平台**

- **Chef** 角色:开私密菜单(carte),录入或 AI 抓取菜品(支持小红书/抖音/B站等链接)
- **Diner** 角色:用 6 位 access code(可选 PIN)加入 chef 的 carte,浏览菜品、下单、评论、提愿望
- **核心场景**:朋友间 / 家人间分享 "我家这周菜单"、私厨接待、家庭主厨给家人准备饭菜
- 区别于个人菜谱整理 app(谱提/ReciMe/Flavorish 等)— Carte 是社交 / 共享场景,不是工具书
- 同一用户可同时是 chef 和 diner(双角色)

---

## 2. 设计 Token(参考,不强约束)

### 颜色调性
| 用途 | 当前值 | 说明 |
|---|---|---|
| 主背景 | `#FAF9F6` | 暖米白,温暖不冷 |
| 卡片背景 | `#FFFFFF` / `#FAF6EE` | 白色 + 米色高亮卡片 |
| 主文字 | `#171717` | 近黑 |
| 次文字 | `#737373` / `#A3A3A3` | 中灰 / 浅灰 |
| 品牌强调 | `#A68B6A` | 褐铜色,用于价格 / chef 元素 / CTA 副色 |
| 食材高亮 | `#C44536` | 红色,步骤里食材 token |
| 紧急 / 错误 | `#A30000` / red-50 / red-200 | 待办订单卡 / error 卡 |
| 边框 | `#E5E5E5` / `#E8DEC8` | 灰 / 米色 |

### 字体
- **Inter**(Regular/Medium/SemiBold/Bold)— 正文 / UI / 数字
- **Fraunces**(Regular/Medium/SemiBold)— **仅** "Carte" 品牌字使用

### 整体气质
- 偏向 brutalist + cookbook 杂糅:大字标题 + 留白多 + 衬线 brand
- 不做花哨阴影 / 渐变;偏 flat
- 圆角偏柔(pills 用 full,卡片用 12px 左右)
- 不堆元素,留白优先

---

## 3. 导航结构

```
[启动 Splash]
   ↓
[Tabs - 底部 2 tab]
   ├─ Kitchen (ChefHat icon)        — 主页:cartes 列表 + chef 摘要卡
   └─ Orders  (ScrollText icon)     — incoming(chef) / outgoing(diner) 切换

栈式跳转:
  → /chef/group/[id]    chef 视角的 carte 详情(管理菜品)
  → /diner/group/[id]   diner 视角的 carte 详情(浏览 + 下单)
  → /dish/[id]          单菜详情(diner / chef 共用)
     └→ /cook/[dishId]  烹饪模式(全屏沉浸)
  → /profile/edit       个人资料编辑
```

---

## 4. Screen 完整清单

### S0. Splash
- 全屏纯背景 + 居中 "Carte" 衬线大字(Fraunces)
- 3 秒 fade-in/out 后跳到 Kitchen

### S1. Kitchen tab(主页)

**功能**:用户的 cartes 列表 + chef 端摘要卡片

**顶部区域**:
- 左:大字标题 "Carte"(Fraunces 衬线)
- 右:用户头像圆形(40×40),点击跳 /profile/edit

**ScrollView 内容(按顺序)**:

1. **PendingOrdersCard** — 待制作订单(红色卡片,仅 chef 有 pending/preparing 订单时显示)
   - 圆形 ChefHat icon 红底
   - 主文字:`{N} 个待制作订单`
   - 摘要副文字:`{diner_name}·{dish_name}  {diner_name2}·{dish_name2}  …`(单行省略)
   - 右侧 chevron-right
   - 点击跳 Orders tab

2. **WeeklyWishlistCard** — 本周愿望榜(米色卡片,仅 chef 有过去 7 天 wishlist 时)
   - 标题:`✨ 本周愿望榜  diners 想吃`
   - top 3 行,每行:
     - 左:👍 + 票数(等宽 50px 左右)
     - 中:愿望 content(单行省略)
     - 右:group_name(单行省略)

3. **RecentCommentsCard** — 最新反馈(白色卡片,仅 chef 有 dish 评论时)
   - 标题:`💬 最新反馈  diners 在说`
   - top 3 行,每行:
     - 左:diner avatar 圆形(32×32)
     - 中上:`{username} · {dish_name}`(米色 dish name)
     - 中下:评论内容(2 行省略)

4. **Cartes 列表** — 用户拥有 / 加入的 carte
   - 每张 `CarteCard`:
     - 封面图(可缺省)
     - carte 名(大字)
     - 6 位 access code(可长按复制)
     - 角色徽章(我是 chef / 我是 diner)
     - 私密锁图标(if is_private)
   - swipe 操作:
     - chef 视角:左滑 → Edit / Delete
     - diner 视角:左滑 → Leave

**右下角 FAB**:
- 黑色圆形 56×56,`+` 图标
- 点击 → 弹 `AddCarteSheet`

**状态视觉**:
- Loading:居中 ActivityIndicator
- Empty:EmptyState "我还没有 carte" + 副标 "创建一个 / 加入朋友的"
- Error:自动 toast(数据错误)

---

### S2. Orders tab

**顶部**:大字标题 "活跃订单"

**Direction switcher**(2 个 pill 按钮 horizontal):
- `incoming` — chef 视角:看到所有别人下给我 carte 的订单
- `outgoing` — diner 视角:看到所有我下出去的订单

**列表**:每条 `OrderListItem`
- 左:dish 缩略图
- 中:dish_name + 数量 + group_name
- 右上:状态 pill(`pending` 黄 / `preparing` 蓝 / `ready` 绿 / `completed` 灰)
- 右下:价格 + tip(if any)
- chef 视角 swipe:推进下一状态 / delete
- diner 视角:仅展示

**空状态**:"还没有订单" + 提示语

---

### S3. Chef Carte 详情(`/chef/group/[id]`)

**顶部**:
- BackButton + carte 名
- 副标:6 位 access code(灰色,长按复制 → toast)
- 私密锁图标 + "私密" 文字(if is_private)

**Tab toggle**:`菜品` / `愿望清单`

**菜品 tab**:
- 横向滚动 categories(每个是椭圆 pill,选中黑底白字,未选灰底)
  - 末尾 `+ 添加分类` pill → 弹 `CategorySheet`
- Categories 长按可弹"编辑/删除分类"
- 主区:被选中 category 下的 dish 列表
  - `DishCard` 卡片(2 列 grid)
  - 三态:正常 / extracting / error(详见第 7 节)
- 底部 sticky CTA:`+ 添加菜品` → 弹 `AddDishMethodSheet`

**愿望清单 tab**:
- WishlistSection(只读,chef 视角不能写)
- 每条:diner 头像 + 名 + 愿望 content + 票数

---

### S4. Diner Carte 详情(`/diner/group/[id]`)

**顶部**:
- BackButton + carte 名
- 副标:`{chef_username} 的 carte`(可点跳 chef profile)

**Tab toggle**:`菜品` / `愿望清单`

**菜品 tab**:
- 左侧 sticky category sidebar(纵向 pill 列表)
- 右侧 dish 列表(`DishCardCompact` 水平卡片):
  - 左:小封面图(80×80 左右)
  - 中:菜名 + 描述(2 行省略) + meta(cuisine · time · cal)
  - 右:价格 + +/- 按钮(加购物车)
- 点击卡片主区 → /dish/[id] 详情

**愿望清单 tab**:
- WishlistSection(可写可投票)
- 顶部输入框:"我想吃……" → 提交
- 列表:diner 头像 + 名 + content + 投票按钮(👍 + 票数)

**右下角 CartFAB**:
- 黑色圆形,显示购物车 items 总数 badge(红圆)
- 加菜时 scale pulse 动画
- 点击弹 `CartSheet`

---

### S5. Dish 详情(`/dish/[id]`)

**顶部 Fixed bar**(半透明白底,scroll 时叠在 hero 上):
- 左:BackButton
- 右:Like 按钮(心形图标 + 数字) + Share 按钮(分享图标)

**ScrollView 内容**:

1. **Hero 图**(1:1 正方形,灰色 placeholder if 缺图)
2. **Pills 横排**(可选):
   - cuisine 米色 pill(如 "日料")
   - carte 名 灰色 pill
   - source_platform 粉色 pill(如 "xiaohongshu.com")
3. **菜名 + 价格行**:
   - 左:菜名(2xl semibold)
   - 右:价格(米色,if > 0)
4. **Meta line**:`{time} 分钟 · {servings} 人份 · {cal} 千卡 · {难度}`
5. **Description**(2-4 行,if any)
6. **Tags**(灰色 pill 群,以 # 开头)
7. **Chef card**(水平):
   - 头像(40×40 圆)
   - chef_username + carte 名
8. **Nutrition**(4 列卡片,if any):蛋白质 / 脂肪 / 碳水 / 纤维(每张显示标签 + g 数)
9. **Ingredients section**:
   - 标题 + 右侧 `[− N 人份 +]` stepper
   - 提示行(if 调整过):"已按 N/原始 比例调整食材用量"(米色小字)
   - 食材 pill 群(灰色 pill,显示 `name quantity`)
10. **Tools**(if any):白底带边框 pill 群(微波炉 / 平底锅 等)
11. **"开始做菜" CTA**(条状大按钮,#A68B6A 底,ChefHat icon + "开始做菜")— 仅 prep/cook steps 非空时显示
12. **Prep steps**(备菜步骤,if any):
    - 标题 "备菜步骤"
    - 每条:圆形序号(米色) + 高亮 step 文本(食材红字) + tip(`💡` if any) + 时长(`约 N 分钟` if any)
13. **Cook steps**(烹饪步骤):同上格式
14. **评论 section**:
    - 标题 + 评论数
    - CommentList(每条:头像 + username + 时间 + content,长按自删)

**底部 Fixed**:CommentComposer(输入框 + 发送按钮)

**Modals 触发**:
- 点击食材 token → IngredientSheet
- 长按自己评论 → ConfirmDialog(删评论)

---

### S6. 烹饪模式(`/cook/[dishId]`,全屏)

**顶部 bar**:
- 左:关闭 X
- 中:菜名(单行省略)
- 右:TTS 切换图标(Volume2 开 / VolumeX 静音)

**进度条**(顶下方):
- 1px 横条(灰底 + #A68B6A 填充)
- 文字:`第 N / M 步 · 备菜 / 烹饪`

**中央内容**(居中,大字):
- HighlightedStepText(step.instruction):
  - 普通文本:深灰大字(2xl 左右)
  - 食材 token:红色加粗(可点)
- Tip 块(if step.tip):米色 alert(`💡 {tip}`)
- 计时器(if step.duration_min):
  - 未启动:大圆角按钮 "[Timer] 开始计时 N 分钟"(米色底)
  - 已启动:超大字倒计时 `5:00` + 下方"取消计时"小字

**底部 nav**:
- 左:"上一步"(灰圆角按钮,disabled if 第 1 步)
- 右:"下一步" / "完成"(黑圆角按钮,最后一步显"完成")

**Sheet 触发**:
- 点击食材 token → IngredientSheet

---

### S7. 个人资料编辑(`/profile/edit`)

**顶部**:
- BackButton + 标题 "编辑资料"

**内容**:
- Avatar 编辑(居中):
  - 圆形头像(120×120 左右)
  - 右下角"编辑"按钮(笔图标)
  - 点击弹 `ImageSourceSheet`(相册 / 拍照)
  - 选完图弹 `AvatarCropSheet`(圆形裁剪 + zoom slider)
- Username 输入(label + Input)
- 保存按钮(底部)

---

## 5. 共享 UI primitives

| 组件 | 用法 | 关键视觉点 |
|---|---|---|
| `AppContainer` | 全屏 SafeArea + 米色 bg | 包所有 screen |
| `BackButton` | 圆形 < 按钮 | 44pt 触摸区,半透明白底 |
| `Button` | CTA | 4 variant: primary 黑 / outline / ghost / destructive 红 |
| `Input` | 表单 | 圆角 + border,placeholder 浅灰 |
| `Sheet` | 通用底部 modal | 圆角顶 + 半透明 backdrop + 顶部 X 关闭 + 标题 |
| `BottomSheet` (@gorhom) | 高级 sheet | 备用,目前主要用 Sheet |
| `ConfirmDialog` | 确认弹窗 | 居中 + 标题 + msg + 取消/确认(destructive 红) |
| `EmptyState` | 空数据 | 居中 + 标题 + 副标(无图标) |
| `Toast` | 操作反馈 | 顶部短促(700ms),success/info/error 色 |

---

## 6. Sheets / Modals 字段清单(13 个,**字段仅供参考**)

> ⚠️ 以下字段是**当前实现的 reference**,设计师可以重新组织、增删,
> 不必逐字段照搬。重点是理解每个 Sheet 的**目的**和**用户输入**。

### 6.1 AddCarteSheet(创建/加入选择)
**触发**:Kitchen FAB
**目的**:用户决定下一步动作
**字段/选项**:
- 大按钮 1:`✨ 创建新 Carte`(我是 chef)
- 大按钮 2:`🔑 加入朋友 Carte`(我是 diner)
- 取消

### 6.2 MenuGroupSheet(创建/编辑 carte)
**触发**:AddCarteSheet 选"创建"、CarteCard swipe Edit
**目的**:chef 创建或编辑自己的菜单
**字段**:
- carte 名(必填,Input)
- access code(自动生成 6 位,可重新生成按钮,大写显示)
- is_private toggle(开/关)
- PIN(条件显示 — 仅 is_private=true 时)
  - 4-6 位数字
  - 显示/隐藏切换
- 保存 / 取消

### 6.3 JoinKitchenSheet(diner 加入)
**触发**:AddCarteSheet 选"加入"
**目的**:用 access code + PIN 加入他人 carte
**字段**:
- access code(6 位输入,autoCapitalize chars,maxLength 6,实时格式化)
- 实时校验后预览:
  - "找到了!" + carte 名 + chef 名 + 头像
  - 若私密:`🔒 这是私密 Carte`
- PIN 输入(条件显示 — 找到的 carte 是私密时)
- 加入按钮(disabled 直到校验通过)

### 6.4 AddDishMethodSheet(添加菜品方式选择)
**触发**:Chef carte 详情 `+ 添加菜品`
**目的**:让 chef 选录入方式
**字段/选项**:
- 大按钮 1:`✨ AI 智能填充`(粘链接/写描述/拍图)— 主推
- 大按钮 2:`✏️ 手动添加`
- 大按钮 3:`📷 拍照识别`(可选,合并到 AI 也可)

### 6.5 SmartFillSheet(AI 智能填充)
**触发**:AddDishMethodSheet 选 AI
**目的**:用户提供链接/文字/图片,AI 抓取生成菜品
**字段/选项**:
- 顶部 mode picker(3 选 1):
  - 🔗 粘贴链接
  - 📝 文字描述
  - 📷 上传图片
- 内容区按 mode 切换:
  - **URL mode**:
    - multiline TextInput,placeholder "贴整段分享文案也可以,自动识别 URL"
    - URL 实时识别提示:`✓ 识别到链接: <url>` (绿色) 或 `没找到 http 链接` (红色)
    - 平台支持说明文字(YouTube / 小红书 / 抖音 / B站 / TikTok / Instagram 等)
  - **Text mode**:
    - multiline TextInput,placeholder "比如: 我想做奶奶的红烧肉,五花肉切方块炖到酥软,要带点甜味…"
  - **Image mode**:
    - 大按钮 / 占位卡 → 选图后显示预览
- 错误 banner(if 提交失败)
- 取消 / 生成菜谱 按钮(loading 时按钮 spinner)

### 6.6 DishSheet(手动编辑菜品)
**触发**:DishCard swipe Edit / AddDishMethodSheet 选手动
**目的**:chef 手动编辑或创建菜品(也用于 AI 抓取后再编辑)
**字段**:
- 菜名(必填)
- 描述(多行)
- 价格(数字键盘,可选,0 = 免费)
- 图片(上传按钮 + 预览,可点击替换)
- ingredients(IngredientsInput 组件 — pill-style 添加,enter / 逗号分割)
- recipe / 步骤(多行文本)
- 是否私密(recipe_is_private toggle)
- 删除按钮(编辑模式才有)
- 保存 / 取消

### 6.7 ImageSourceSheet(选图源)
**触发**:DishSheet 图片上传 / Profile avatar
**目的**:让用户选图来源
**字段/选项**:
- 从相册
- 拍照
- 取消

### 6.8 CategorySheet(分类编辑)
**触发**:Chef carte 详情 `+ 添加分类` / 长按分类
**目的**:管理菜品分类
**字段**:
- 分类名(必填)
- 删除按钮(编辑模式)
- 保存 / 取消

### 6.9 IngredientSheet(食材详情)
**触发**:dish 详情页 / 烹饪模式 步骤里点食材 token
**目的**:让用户看到食材的具体用量(尤其是缩放后)+ 备注
**字段(展示)**:
- 食材名(标题)
- 用量
  - 主显:缩放后用量(if servings 调整过)
  - 副显:`原 200g`(原始用量,if 不同)
  - 缺省:"未注明,按口味添加"
- 备注(if any)

### 6.10 CartSheet(购物车 / 下单)
**触发**:diner CartFAB
**目的**:diner 提交订单
**字段**:
- 购物车 items 列表(每行):
  - dish 缩略图 + 菜名
  - 数量 +/- 按钮
  - 小计价格
  - 删除
- 小费(tip)输入(数字键盘,可选)
- 备注(textarea,可选 — 给 chef 留话)
- 总价(items 小计 + tip)
- 提交订单按钮(loading 时 spinner)
- 取消

### 6.11 ConfirmDialog(确认弹窗)
**触发**:删除菜品 / 删除评论 / 删除 carte / 离开 carte 等
**字段**:
- 标题
- 副标 / message(可选)
- 取消按钮(灰)
- 确认按钮(destructive 时红色)

### 6.12 UsernamePrompt(首次登录设置 username)
**触发**:auth 通过但 profile.username 缺失
**目的**:强制 onboarding 输 username
**字段**:
- 全屏 modal(不可关闭)
- 大字 "你叫什么"
- username 输入(单行)
- 继续按钮(disabled 直到非空)

### 6.13 AvatarCropSheet(头像裁剪)
**触发**:Profile edit 选完图后
**目的**:圆形裁剪 + zoom
**字段**:
- 图片预览 + 圆形 mask
- zoom slider
- 完成 / 取消

---

## 7. 关键状态视觉

### DishCard 三态(必做!这是 AI 抓取的核心 UX)

#### 7.1 正常态
- 顶部:封面图(无图时灰底)
- 下方:
  - 菜名(单行省略) + 价格(米色,if > 0)
  - meta line: `{cuisine} · {cal} 千卡 · {time} 分钟`(米色小字)
  - 描述(2 行省略,if any)

#### 7.2 Extracting 态(AI 抓取中)
- 封面占位:灰底 + UtensilsCrossed icon(米色)
- 下方:
  - Spinner + 阶段文案:
    - `抓取链接内容` / `已抓到数据,准备 AI 整理` / `AI 正在整理菜谱`
  - 右上:百分比 `42%`
  - 进度条(底部细条,米色推进)
  - "取消"小字按钮

#### 7.3 Error 态(抓取失败)
- 红色卡片(`bg-red-50` + `border-red-200`)
- AlertCircle icon + "提取失败" 标题
- 错误信息(2-3 行,红 600)
- 底部:重试 / 删除 按钮

### 订单状态 pill
- `pending` = 黄
- `preparing` = 蓝
- `ready` = 绿
- `completed` = 灰
- `cancelled` = 红

### 通用空 / 加载 / 错误
- Loading:居中 ActivityIndicator
- Empty:居中 EmptyState(标题 + 副标,无图标)
- Error:顶部 toast 或 inline banner(红 50)

---

## 8. 关键交互流程(给设计师 user journey)

### 流程 A:Chef 录入菜品(AI 抓取)
1. Kitchen → 点 carte 卡片 → chef carte 详情
2. 选 category → 点 `+ 添加菜品`
3. AddDishMethodSheet → 选 `✨ AI 智能填充`
4. SmartFillSheet → 选 `🔗 粘贴链接` → 粘贴小红书 URL → 提交
5. Sheet 立即关闭 + dish 列表出现"占位卡"(extracting 态)
6. 30-90 秒进度条推进 → 完成时卡片"长出"完整内容(封面 + 菜名 + 食材 + 步骤)
7. realtime 自动刷新

### 流程 B:Diner 加入 carte 下单
1. Kitchen → FAB → AddCarteSheet → "加入"
2. JoinKitchenSheet → 输入 6 位 code → (私密则 PIN 框) → 加入
3. 跳 diner carte 详情
4. 浏览菜品(category sidebar + dish 卡片)
5. 点菜品 +1 → CartFAB scale pulse + badge 数字+1
6. 点 CartFAB → CartSheet 列表 + tip + 备注 → 提交订单
7. 订单 toast 反馈
8. Chef 端接收:实时 toast + 待办卡片刷新 + 本地通知

### 流程 C:Diner 烹饪一道菜
1. Dish 详情页 → 调份量 stepper(食材数字按比例 scale,提示行出现)
2. 滚到底部 → 点"开始做菜"CTA
3. 进入烹饪模式(屏幕常亮 + 居中大字步骤 + 食材高亮)
4. 食材 token 红色高亮可点 → 弹 IngredientSheet 看用量
5. 步骤含"焖 5 分钟" → 点开始计时 → 大字倒计时 + 归零本地通知
6. TTS 自动朗读步骤(可静音)
7. 上一步/下一步翻页
8. 最后一步 → "完成" 按钮 → 返回 dish 详情

### 流程 D:Chef 处理订单 + 看反馈
1. Chef 主页 Kitchen 看到 3 张摘要卡:
   - 红色"待制作订单"(数字 + diner 摘要)
   - 米色"本周愿望榜"(diner 想吃啥)
   - 白色"最新反馈"(diner 评论摘要)
2. 点待制作订单卡片 → 跳 Orders tab
3. swipe 推进订单状态(pending → preparing → ready → completed)
4. Diner 端实时收到状态变化 toast

### 流程 E:私密分享(carte 加 PIN)
1. Chef 在 MenuGroupSheet 创建 carte 时打开 is_private + 设 PIN
2. Carte 详情顶部显示 🔒 私密图标
3. Chef 截图或复制 access code(长按 → toast "已复制")
4. 把 code + PIN 私下发给朋友
5. 朋友走流程 B 加入

---

## 9. 给 Figma Make 的提示词模板

```text
Design a recipe-sharing chef-diner platform mobile app called "Carte".

CONTEXT:
- Two-sided platform: chefs publish private menus (each menu has a 6-character
  access code, optionally PIN-locked); diners join via the code, browse dishes,
  place orders, leave comments, and submit wish-list requests.
- Distinct from individual recipe-organizing apps — Carte is social/sharing.
- Brand: warm, brutalist meets cookbook. White/cream backgrounds, copper-brown
  (#A68B6A) accent, soft red (#C44536) for ingredient highlights.
- Brand font: Fraunces (serif). UI font: Inter.

SCREENS TO DESIGN:
1. Splash — centered "Carte" serif lockup, fade in/out
2. Kitchen tab (home) — cartes list + 3 chef summary cards (pending orders / weekly
   wishlist / recent comments) + bottom 2-tab nav + FAB
3. Orders tab — incoming/outgoing toggle + order cards with status pills
4. Chef carte detail — categories scroller + dish grid + bottom CTA
5. Diner carte detail — category sidebar + dish list + cart FAB
6. Dish detail — hero image + meta row + servings stepper + ingredient pills +
   tools + start-cooking CTA + step rows + comments
7. Cooking mode (fullscreen) — progress bar + huge step text with red ingredient
   tokens + timer + bottom nav
8. Profile edit — avatar + username

13 SHEET / MODAL COMPONENTS (see brief for fields):
- AddCarteSheet, MenuGroupSheet, JoinKitchenSheet
- AddDishMethodSheet, SmartFillSheet, DishSheet
- ImageSourceSheet, CategorySheet
- IngredientSheet, CartSheet
- ConfirmDialog, UsernamePrompt, AvatarCropSheet

3 DISH CARD STATES (must design):
- Normal: cover + name + price + meta
- Extracting: gray placeholder + spinner + stage label + percentage + cancel
- Error: red card + error msg + retry/delete

KEY DIFFERENTIATORS (Carte unique vs competitors):
- Chef-diner duality (private menus, access codes, PIN)
- Pending orders red card on chef home
- Weekly wishlist board (diners' food requests aggregated)
- Recent comments aggregated (chef sees diner reactions)
- Cooking mode with tappable ingredient tokens (sheet shows scaled quantity)
- AI extraction loading states (placeholder card → progress → reveal)

The provided brief gives field-level reference for each sheet/screen. Treat
those fields as PRODUCT REQUIREMENTS (the data we need to capture or display)
but redesign the layout/visual freely.
```

---

## 10. 设计师可自由决定的(刻意没约束)

- 字号阶梯 / 行高 / 字间距
- 间距 / padding / margin 数值
- 阴影 / 模糊 / 渐变
- 卡片圆角值
- 动画 / transition 细节
- 具体 icon 选用
- Tab bar 形态(底部 / 顶部 / 浮动)
- Sheet 进出动画

---

## 11. 设计师 SHOULD NOT 改的(产品边界)

这些是产品决定,非视觉决定:

- 双角色模型(chef × diner)— 核心定位
- 6 位 access code + 可选 PIN 的隐私模型
- AI 抓取的"占位卡 → 阶段进度 → 完整内容长出"流程(非阻塞设计)
- DishCard 三态(normal/extracting/error)
- chef-diner 的订单 + 评论 + wishlist 反馈循环
- 烹饪模式的"屏幕常亮 + 大字步骤 + 食材 token + 计时器"组合
- 底部 Tabs 数量 = 2(Kitchen + Orders),不要加更多

---

## 文档版本

- 2026-04-30 — v1 初版,基于当前 codebase 字段清单
