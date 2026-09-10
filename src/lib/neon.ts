import { createClient } from '@neondatabase/neon-js';
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

export const neon = createClient({
  auth: {
    url: import.meta.env.VITE_NEON_AUTH_URL,
    adapter: BetterAuthReactAdapter(),
  },
  dataApi: {
    url: import.meta.env.VITE_NEON_DATA_API_URL,
  },
});

export async function queryTodos() {
  const { data: todos, error } = await neon
    .from('todos')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  return todos;
}
