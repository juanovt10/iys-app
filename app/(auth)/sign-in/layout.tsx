
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {

  const supabase = createClient()

  const { data, error } = await supabase.auth.getUser()
  if (data?.user) {
    redirect('/')
  }

  return (
    <main>
      {children}
    </main>
  );
}
