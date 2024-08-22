import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import supabase from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);  // Add loading state
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getSession();
      const currentUser = data?.session?.user || null;
      setUser(currentUser);
      setLoading(false);  // Set loading to false once the session is checked

      if (!currentUser && pathname !== '/sign-in') {
        router.push('/sign-in'); // Redirect to login if not authenticated
      }

      if (currentUser && pathname === '/sign-in') {
        router.push('/'); // Redirect to home if authenticated and trying to access sign-in
      }
    };

    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);

      if (session?.user && pathname === '/sign-in') {
        router.push('/'); // Redirect to home if authenticated and trying to access sign-in
      } else if (!session?.user) {
        router.push('/sign-in'); // Redirect to login if logged out
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  return { user, loading };
};
