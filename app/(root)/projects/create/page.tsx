import { Suspense } from "react";
import CreateProjectClient from "./CreateProjectClient";
import { getSessionAndRole } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: { searchParams?: { q?: string; sort?: string } }) {
  const { role } = await getSessionAndRole();
  if (role === 'site_manager') redirect('/projects');
  const initialQuery = (searchParams?.q ?? "").toString();
  const initialSort = (searchParams?.sort ?? "recent").toString();
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <CreateProjectClient initialQuery={initialQuery} initialSort={initialSort as any} />
    </Suspense>
  );
}
