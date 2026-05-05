import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, focusManager } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { AppState, type AppStateStatus } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 min
      gcTime: 1000 * 60 * 60 * 24, // 24h - keep cached for offline
      retry: 2,
      // App-foreground refresh: respects staleTime, so it only refetches
      // queries that are actually stale. Wired below via focusManager +
      // AppState listener (RN doesn't fire "focus" events automatically).
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Bridge React Native AppState → React Query focus manager. Without this,
// refetchOnWindowFocus is a no-op on RN. Effect: when chef leaves app
// during a 30-90s AI extraction and comes back, dish state refreshes
// immediately instead of relying on the next realtime push (which may
// have been missed if the channel disconnected during background).
AppState.addEventListener('change', (status: AppStateStatus) => {
  focusManager.setFocused(status === 'active');
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'CARTE_QUERY_CACHE',
  // Don't persist mutations across launches
  serialize: (data) => JSON.stringify({ ...data, mutations: [] }),
  deserialize: (str) => JSON.parse(str),
});
