import type { Tables, TablesInsert, TablesUpdate } from './database.types';

export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

export type MenuGroup = Tables<'menu_groups'>;
export type MenuGroupInsert = TablesInsert<'menu_groups'>;
export type MenuGroupUpdate = TablesUpdate<'menu_groups'>;

export type MenuGroupMember = Tables<'menu_group_members'>;

export type Category = Tables<'categories'>;
export type CategoryInsert = TablesInsert<'categories'>;

export type Dish = Tables<'dishes'>;
export type DishInsert = TablesInsert<'dishes'>;
export type DishUpdate = TablesUpdate<'dishes'>;

export type OrderSession = Tables<'order_sessions'>;
export type OrderSessionInsert = TablesInsert<'order_sessions'>;

export type Order = Tables<'orders'>;
export type OrderInsert = TablesInsert<'orders'>;
export type OrderUpdate = TablesUpdate<'orders'>;

export type DishLike = Tables<'dish_likes'>;
export type DishComment = Tables<'dish_comments'>;
export type DishCommentInsert = TablesInsert<'dish_comments'>;

export type Wishlist = Tables<'wishlist'>;
export type WishlistInsert = TablesInsert<'wishlist'>;

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type Role = 'diner' | 'chef' | 'both';

/**
 * 食材现在支持两种形态:旧版纯字符串 ("番茄罐头 200g"),新版 AI 解析后的
 * 结构化对象。UI 渲染时需 normalize 处理。
 */
export type Ingredient = string | { name: string; quantity?: string; note?: string };

export type RecipeStep = {
  order: number;
  instruction: string;
  duration_min?: number;
  tip?: string;
};

export type Nutrition = {
  protein_g?: number;
  fat_g?: number;
  carbs_g?: number;
  fiber_g?: number;
};

export type ExtractStatus = 'extracting' | 'error' | null;
export type ExtractStage =
  | 'fetching' // 获取笔记 / 视频字幕
  | 'parsing' // 解析内容
  | 'integrating' // AI 整理
  | null;
export type Difficulty = 'easy' | 'medium' | 'hard';

export type DishWithChef = Dish & {
  menu_groups: Pick<MenuGroup, 'id' | 'name' | 'is_private' | 'chef_id'> & {
    profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  };
  likes_count?: number;
  liked_by_me?: boolean;
};
