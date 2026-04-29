/**
 * 中央 cache key 注册表 + invalidation helper。
 *
 * 为什么需要这个文件:每条 query/mutation 各自定义 key 时,容易出现
 * "mutation 改了表 T,但漏 invalidate 某个读 T 的 query key"。最常见
 * 起因 = UI 重构(比如把两个 list 合并成一个)后忘了同步 mutation 端。
 *
 * 这里把"哪条变更应该 bust 哪些 key"写在一处,mutation 文件里只需调
 * `cacheBus.afterXxx(qc, ids)`,新增 query 时也只在这个文件里登记。
 *
 * 写约定:
 * - 凡是表里某条记录的 update/delete,都按"目标 id"+"目标 user_id"双索引 bust。
 * - 跨用户 cache(比如 chef 改订单 → 影响 diner 自己的 my-orders)用 prefix
 *   match,即 `queryKey: ['my-orders']` 不带 uid,react-query 会 bust 所有 ['my-orders', *]。
 */

import type { QueryClient } from '@tanstack/react-query';

// ---- Key factories (单一真相;每个 query hook 都从这里 import) ----

export const profileKey = (userId: string | undefined) => ['profile', userId] as const;

export const myCartesKey = (userId: string | undefined) => ['my-cartes', userId] as const;
export const menuGroupsKey = (userId: string | undefined) => ['menu-groups', userId] as const;
export const joinedKitchensKey = (userId: string | undefined) =>
  ['joined-kitchens', userId] as const;

export const chefGroupKey = (groupId: string) => ['chef-group', groupId] as const;
export const dinerMenuKey = (groupId: string) => ['diner-menu', groupId] as const;

export const dishDetailKey = (dishId: string) => ['dish-detail', dishId] as const;
export const dishCommentsKey = (dishId: string) => ['dish-comments', dishId] as const;

export const myOrdersKey = (userId: string | undefined) => ['my-orders', userId] as const;
export const chefOrdersKey = (userId: string | undefined) =>
  ['chef-orders', userId] as const;

export const wishlistKey = (groupId: string) => ['wishlist', groupId] as const;

// ---- "事件 → 应该 bust 的 keys" 映射 ----

const inv = (qc: QueryClient, key: readonly unknown[] | unknown[]) =>
  qc.invalidateQueries({ queryKey: key as readonly unknown[] });

const rm = (qc: QueryClient, key: readonly unknown[] | unknown[]) =>
  qc.removeQueries({ queryKey: key as readonly unknown[] });

export const cacheBus = {
  /** 用户改了自己的 profile (name / avatar)。profile 是 denormalized 到很多 join 里的,
   *  几乎所有显示用户信息的 cache 都要 bust。 */
  afterProfileUpdate(qc: QueryClient, userId: string | undefined) {
    inv(qc, profileKey(userId));
    inv(qc, myCartesKey(userId)); // own cartes 显示自己头像
    inv(qc, ['dish-detail']); // 任何菜品详情可能 join 当前用户的 chef profile
    inv(qc, ['diner-menu']); // diner 看的 carte 也 join chef profile
    inv(qc, ['my-orders']); // 我的订单 join chef profile
    inv(qc, ['chef-orders']); // chef 看的订单 join diner profile (可能有别人在订我)
    inv(qc, ['wishlist']); // wishlist 项 join requester profile
    inv(qc, ['dish-comments']); // 评论 join commenter profile
  },

  /** 创建了一个 carte (我是 chef)。 */
  afterCarteCreate(qc: QueryClient, userId: string | undefined) {
    inv(qc, menuGroupsKey(userId));
    inv(qc, myCartesKey(userId));
  },

  /** 更新了一个 carte (改名 / 改 access_code / 改 PIN / 改 is_private)。 */
  afterCarteUpdate(qc: QueryClient, userId: string | undefined, groupId: string) {
    inv(qc, menuGroupsKey(userId));
    inv(qc, myCartesKey(userId));
    inv(qc, chefGroupKey(groupId));
    inv(qc, dinerMenuKey(groupId));
  },

  /** 删除了 carte。FK cascade 会清掉 categories/dishes/orders/wishlist,本地 cache
   *  对应 group 的视图直接 remove,跨用户 cache 用 prefix 重取。 */
  afterCarteDelete(qc: QueryClient, userId: string | undefined, groupId: string) {
    inv(qc, menuGroupsKey(userId));
    inv(qc, myCartesKey(userId));
    rm(qc, chefGroupKey(groupId));
    rm(qc, dinerMenuKey(groupId));
    rm(qc, wishlistKey(groupId));
    inv(qc, chefOrdersKey(userId));
    inv(qc, ['my-orders']); // diners 那边的视图也要重取
  },

  /** 加入了某个 carte (我是 diner)。 */
  afterCarteJoin(qc: QueryClient, userId: string | undefined) {
    inv(qc, joinedKitchensKey(userId));
    inv(qc, myCartesKey(userId));
  },

  /** 离开了某个 carte。 */
  afterCarteLeave(qc: QueryClient, userId: string | undefined) {
    inv(qc, joinedKitchensKey(userId));
    inv(qc, myCartesKey(userId));
  },

  /** 创建/更新/删除了 dish。 */
  afterDishMutate(qc: QueryClient, groupId: string, dishId?: string) {
    inv(qc, chefGroupKey(groupId));
    inv(qc, dinerMenuKey(groupId));
    if (dishId) inv(qc, dishDetailKey(dishId));
  },

  afterDishDelete(qc: QueryClient, groupId: string, dishId: string) {
    inv(qc, chefGroupKey(groupId));
    inv(qc, dinerMenuKey(groupId));
    rm(qc, dishDetailKey(dishId));
    rm(qc, dishCommentsKey(dishId));
  },

  /** 创建/更新/删除了 category。 */
  afterCategoryMutate(qc: QueryClient, groupId: string) {
    inv(qc, chefGroupKey(groupId));
    inv(qc, dinerMenuKey(groupId));
  },

  /** 评论增/删。除了走 realtime,这里也主动 bust 一次防 realtime 断连。 */
  afterCommentMutate(qc: QueryClient, dishId: string) {
    inv(qc, dishCommentsKey(dishId));
  },

  /** Diner 下了一个新订单 = 创建 order_session + N 个 orders。 */
  afterOrderCreate(qc: QueryClient, dinerUserId: string | undefined) {
    inv(qc, myOrdersKey(dinerUserId));
    inv(qc, ['chef-orders']); // 该 chef 的 orders 列表也要刷
  },

  /** Chef 改了订单状态 / 删除订单。 */
  afterOrderStatusChange(qc: QueryClient, chefUserId: string | undefined) {
    inv(qc, chefOrdersKey(chefUserId));
    inv(qc, ['my-orders']); // 影响对应 diner 的视图,跨用户用 prefix
  },

  /** Wishlist 增/删/投票。 */
  afterWishlistMutate(qc: QueryClient, groupId: string) {
    inv(qc, wishlistKey(groupId));
  },
};
