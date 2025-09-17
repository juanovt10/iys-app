import { redirect } from "next/navigation";
import { getSessionAndRole } from "@/lib/supabase/server";
import QuotesClient from "./QuotesClient";

export default async function QuotesPage() {
  const { role } = await getSessionAndRole();
  if (role === 'site_manager') {
    return redirect('/');
  }
  return <QuotesClient />;
}
