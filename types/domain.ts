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

export type Ingredient = string;

export type DishWithChef = Dish & {
  menu_groups: Pick<MenuGroup, 'id' | 'name' | 'is_private' | 'chef_id'> & {
    profiles: Pick<Profile, 'id' | 'username' | 'avatar_url'>;
  };
  likes_count?: number;
  liked_by_me?: boolean;
};
