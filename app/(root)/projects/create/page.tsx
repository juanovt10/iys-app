import { Suspense } from "react";
import CreateProjectClient from "./CreateProjectClient";

export default async function Page({
  searchParams,
}: { searchParams?: { q?: string; sort?: string } }) {
  const initialQuery = (searchParams?.q ?? "").toString();
  const initialSort = (searchParams?.sort ?? "recent").toString();
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}>
      <CreateProjectClient initialQuery={initialQuery} initialSort={initialSort as any} />
    </Suspense>
  );
}
