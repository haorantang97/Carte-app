# Carte

A React Native (Expo) iOS/Android app for sharing private cookbooks ("cartes")
with diners — a complete rewrite of the original Carte PWA with the same
feature set, an improved data model, and proper realtime support.

The app is two-sided: **Chefs** create menus (cartes) with categories, dishes,
and ingredients; **Diners** join with a 6-character code (or PIN-protected for
private cartes), browse, comment, and place orders.

## Stack

```
Expo SDK 54 (managed)        | expo-router 6 (file-based)
React 19 + RN 0.81           | twrnc (Tailwind utilities at runtime)
@tanstack/react-query 5      | + AsyncStorage persistence (offline-friendly)
@supabase/supabase-js 2      | Postgres + Auth + Storage + Realtime
react-hook-form-style state  | + zod validation (forms)
i18next + react-i18next      | en / zh, AsyncStorage-backed
react-native-reanimated 4    | + react-native-worklets/plugin
expo-image-picker / -manipulator / expo-image / expo-haptics / expo-clipboard
@shopify/flash-list          | (installed for future masonry)
zustand (cart only)          | per-menu_group_id isolation, AsyncStorage persist
```

## Local setup

Prereqs: Node 24+, npm, Xcode (for iOS simulator) or Android Studio.

```bash
# 1. Install
cd ~/Carte
npm install

# 2. Configure environment (one-time)
cp .env.example .env
# .env already populated with the Carte-data Supabase publishable key.
# (.env is gitignored.)

# 3. Run
npx expo start --ios       # iOS simulator
npx expo start --android   # Android emulator
```

### Anonymous sign-in (one manual toggle in Supabase dashboard)

Carte uses Supabase **anonymous sign-in** for v1 — no auth UI, no signup flow,
each fresh install becomes its own user. This needs to be enabled once in the
Supabase project:

1. Go to https://supabase.com/dashboard/project/apegjzfrjbmknytzohck
2. Authentication → Providers (or Sign In / Up)
3. Enable **"Allow anonymous sign-ins"**

If anonymous sign-in is disabled, the app will fail to boot with an auth error
in the console. (The fix is one toggle, not a code change.)

## Project layout

```
app/                       # expo-router file tree
├── _layout.tsx           # Providers, splash, ensureSession()
├── index.tsx             # → redirect to (tabs)/kitchen
├── (tabs)/
│   ├── _layout.tsx       # Bottom tabs (Kitchen / Discover / Profile)
│   ├── kitchen.tsx       # ModeCard for Chef + Diner
│   ├── discover.tsx      # Public dish masonry feed
│   └── profile.tsx       # Avatar + tap-to-edit
├── chef/
│   ├── _layout.tsx
│   ├── index.tsx         # My cartes (list + create)
│   ├── group/[id].tsx    # Categories + dishes
│   └── orders.tsx        # Active orders + ShoppingMode
├── diner/
│   ├── _layout.tsx
│   ├── index.tsx         # Joined kitchens + JoinKitchenSheet
│   └── group/[id].tsx    # Browse + cart + wishlist
├── dish/[id].tsx         # Hero + likes + comments
└── profile/edit.tsx      # Avatar + username

components/
├── ui/                   # AppContainer, BackButton, Button, Input, Sheet,
│                         # ConfirmDialog, EmptyState, Toast helper
├── splash/SplashScreen   # 2.5s "Carte" serif fade
├── home/                 # ModeCard, DishFeedCard, DiscoverFeed
├── chef/                 # MenuGroupCard, MenuGroupSheet, DishCard,
│                         # DishSheet, CategorySheet, OrderCard,
│                         # ShoppingModeView, IngredientsInput
├── diner/                # KitchenCard, JoinKitchenSheet,
│                         # DishCardCompact, CartFAB, CartSheet
├── dish/                 # CommentList, CommentComposer
└── wishlist/WishlistSection

hooks/
├── auth/                 # useSession, useProfile (+ update)
├── chef/                 # useMenuGroups, useChefGroupDetails,
│                         # useCategoryMutations, useDishMutations,
│                         # useChefOrders (+ status update + delete)
├── diner/                # useJoinedKitchens, useJoinKitchen,
│                         # useFindCarte, useDinerMenu
├── feed/useDiscoverFeed  # useInfiniteQuery (20/page) + likes realtime
├── dish/                 # useDishDetail, useDishLikes, useDishComments
├── wishlist/useWishlist  # list + create + toggle vote (RPC)
├── orders/useCreateOrder # session + N orders, atomic-ish
├── realtime/             # useRealtimeOrders (chef), useRealtimeOrderStatus (diner)
└── storage/              # usePickAndUploadImage (resize → 1080w / 80% jpeg)

lib/                      # supabase client, queryClient + persist,
                          # auth helpers, tw, i18n, constants, time, etc.
stores/cartStore.ts       # Zustand cart, scoped per menu_group_id
i18n/{en,zh}.json         # Translation resources
types/database.types.ts   # Auto-generated from Supabase schema
types/domain.ts           # Semantic re-exports
supabase/                 # (none in repo — migrations applied via MCP)
```

## Backend

Project: **Carte-data** (`apegjzfrjbmknytzohck`, eu-west-1).

12 migrations applied through Supabase MCP:

```
0001_init_profiles_and_role          profiles + role + auth-trigger
0002_menu_groups                      6-char access_code (auto-uppercase),
                                      is_private, password_hash (bcrypt)
0003_menu_group_members_and_helpers   members + RLS-helpers (SECURITY DEFINER)
0004_categories_and_dishes            numeric price, recipe + recipe_is_private
0005_orders_and_sessions              order_sessions + orders w/ price snapshot
0006_dish_likes                       (修复:原版表缺失)
0007_dish_comments                    (修复:原版表缺失;支持自删除)
0008_wishlist_with_votes              wishlist + dedup table + count trigger
0009_storage_buckets                  menu-images, avatars (own-folder RLS)
0010_rpc_functions                    find_group_by_access_code,
                                      verify_carte_password, set_carte_password,
                                      toggle_wishlist_vote
0011_realtime_publication             orders, dish_likes, dish_comments,
                                      wishlist, wishlist_votes
0012_security_hardening               search_path, RPC grants, bucket policies
```

See `CHANGELOG_FROM_ORIGINAL.md` for the full list of intentional
divergences from the original PWA's data model.

## Verification

```bash
npx tsc --noEmit            # 0 errors
npx expo-doctor             # 17/17 checks pass
```

## What's NOT in v1 (deferred)

- Sign in with Apple / Google (needs external OAuth setup)
- Push notifications (needs APNs key uploaded to Expo)
- Privacy policy / Terms / account-deletion screens (compliance)
- Chef-side wishlist FAB across all groups (the per-group view is in)
- Dark mode (palette is light-only for v1)
