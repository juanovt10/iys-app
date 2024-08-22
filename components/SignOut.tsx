'use client';

import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const SignOutButton = () => {
  const router = useRouter();
  const { user, loading } = useAuth(); // Use the auth hook to ensure the user is loaded

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error.message);
    } else {
      router.push('/sign-in'); // Redirect to the sign-in page after sign-out
    }
  };

  if (loading) {
    return null; // Don't show the button if the authentication state is loading
  }

  if (!user) {
    return null; // Don't show the button if the user is not logged in
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
};

export default SignOutButton;
