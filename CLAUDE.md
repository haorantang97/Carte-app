# Carte — agent guide

Reading this file first will save the next agent (or human) a lot of code-spelunking.

## What this is

Two-sided RN/Expo app: chefs publish private "cartes" (menus); diners join with
a 6-char code (with optional PIN), browse, comment, and place orders. Backed
by Supabase Postgres + Auth + Storage + Realtime.

## Tech defaults — do not deviate without reason

- **Routing**: expo-router (file-based). Modal-style flows use `Sheet`
  (`components/ui/Sheet.tsx`) which is RN `Modal` + slide animation.
- **Styling**: `twrnc` only. Import `tw` from `@/lib/tw`. No StyleSheet,
  no NativeWind. Tailwind classes are *runtime*, so dynamic strings work.
- **Server state**: React Query 5. Every supabase call lives inside a hook
  with a stable query key. Persist via AsyncStorage (already configured in
  `lib/queryClient.ts`).
- **Cart state**: Zustand store at `stores/cartStore.ts`. **Always per
  `menu_group_id`** — never global.
- **Auth**: `lib/auth.ts:ensureSession()` is called once in the root layout.
  v1 = anonymous sign-in. The `profiles` row is auto-created via the
  `on_auth_user_created` trigger on `auth.users`.
- **i18n**: Strings live in `i18n/{en,zh}.json`. Use `useTranslation()` from
  `react-i18next`; in non-component code call `i18n.t(...)` from
  `@/lib/i18n`.

## Conventions

- **Hooks** are organized by feature folder (`hooks/<feature>/use<Thing>.ts`).
  All return value shapes are derived from `types/database.types.ts` types
  (regenerate via `mcp__supabase__generate_typescript_types` after schema
  changes).
- **Mutations** invalidate the relevant query key. Use `setQueryData` for
  optimistic updates (see `useToggleDishLike` for the canonical pattern that
  patches both feed and detail caches).
- **Realtime** lives in `hooks/realtime/`. Channel names always include the
  current `user.id` to avoid cross-user contention. Cleanup with
  `supabase.removeChannel(channel)` in the `useEffect` return.
- **RLS helpers** (`is_group_chef`, `is_group_member`, `is_group_public`)
  exist at the SQL layer and back many policies — don't drop them.
- **PIN handling** never sends plaintext to a regular column. Always go
  through the `set_carte_password` and `verify_carte_password` RPCs (bcrypt
  via pgcrypto in the function body).
- **Image upload** goes through `usePickAndUploadImage(bucket, opts?)` which
  resizes to 1080px max edge / 80% JPEG via `expo-image-manipulator` before
  uploading.

## Common pitfalls

- **`fetch(localUri).arrayBuffer()`** is the working pattern for uploading
  picker URIs to Supabase Storage on RN. Don't try `Blob` (broken in RN)
  or `FormData` (unreliable).
- The `BottomSheetModalProvider` is mounted in `_layout.tsx` for future
  use, but v1 sheets all use the simple `Modal`-based `Sheet`. Don't mix
  the two libraries on the same screen.
- The Splash overlay (`components/splash/SplashScreen.tsx`) is gated by
  `bootDone && splashDone`. Both must be true to dismiss — don't bypass
  the minimum display window or `ensureSession` may not have completed.
- `expo-router` Stack.Screen names are paths, not arbitrary IDs. If a
  route file moves, update `app/_layout.tsx` accordingly.

## Schema reminders

- `menu_groups.is_private` is the **single source of truth** for privacy.
  Never re-introduce reading `password` to infer privacy (the original PWA
  bug).
- `orders` always carry `menu_group_id` and `price_at_order` — don't
  remove these columns; they break Chef-orders perf and history.
- `wishlist.votes` is **maintained by the
  `update_wishlist_votes_count` trigger**. Don't update it manually;
  insert/delete `wishlist_votes` rows.

## When schema changes

```bash
# Generate types
# (use the Supabase MCP `generate_typescript_types` tool)
# Save output to types/database.types.ts
```

## Running

```bash
npm install
cp .env.example .env       # already filled in for the Carte-data project
npx expo start --ios
```

## Out of scope (intentionally) for v1

OAuth (Apple/Google), push notifications, privacy/terms screens,
account-deletion UI, chef-side cross-group wishlist FAB, dark mode.

When adding any of these, expect an external-config pre-req (Apple
Developer, Google Cloud, APNs). See the original audit for full notes.
