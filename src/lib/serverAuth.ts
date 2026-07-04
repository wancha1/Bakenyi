import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase client for Next.js Server Components, Actions, or Route Handlers.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are missing on the server.');
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll().map((cookie) => ({
          name: cookie.name,
          value: cookie.value,
        }));
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // sessions.
        }
      },
    },
  });
}

/**
 * Helper to fetch the currently authenticated user on the server side.
 * Extremely secure as it fetches directly from Supabase auth.getUser API.
 */
export async function getServerUser() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch (err) {
    console.error('getServerUser Exception:', err);
    return null;
  }
}

/**
 * Fetches the user profile and checks if they have administrative permissions.
 */
export async function checkServerIsAdmin(): Promise<{ isAdmin: boolean; user: any; profile: any }> {
  const user = await getServerUser();
  if (!user) {
    return { isAdmin: false, user: null, profile: null };
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error || !profile) {
      return { isAdmin: false, user, profile: null };
    }

    const isAdmin = profile.role === 'admin' || profile.is_admin === true;
    return { isAdmin, user, profile };
  } catch (err) {
    console.error('checkServerIsAdmin Exception:', err);
    return { isAdmin: false, user, profile: null };
  }
}
