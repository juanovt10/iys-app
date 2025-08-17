"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value?: number | string;
  href?: string;
}) {
  const body = (
    <Card className="transition hover:shadow-sm">
      <CardContent className="p-4">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">
          {value ?? 0}
        </div>
      </CardContent>
    </Card>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

// app/projects/[id]/_components/StatGrid.tsx
export default function StatGrid({
  items,
  deliverables,
  cuts,
  links,
}: {
  items?: number;                     // ← optional now
  deliverables: number;
  cuts: number;
  links?: { deliverables?: string; cuts?: string };
}) {
  const cards = [
    ...(typeof items === "number" ? [{ label: "Items", value: items }] : []),
    { label: "Deliverables", value: deliverables, href: links?.deliverables },
    { label: "Cuts", value: cuts, href: links?.cuts },
  ];
  const cols = cards.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2";
  return (
    <div className={`grid gap-4 sm:grid-cols-2 ${cols}`}>
      {cards.map((c, i) => (
        <StatCard key={i} label={c.label} value={c.value} href={c.href} />
      ))}
    </div>
  );
}
