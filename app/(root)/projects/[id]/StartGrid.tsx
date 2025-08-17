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

export default function StatGrid({
  items,
  deliverables,
  cuts,
  links,
}: {
  items: number;
  deliverables: number;
  cuts: number;
  links?: { deliverables?: string; cuts?: string };
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Items" value={items} />
      <StatCard
        label="Deliverables"
        value={deliverables}
        href={links?.deliverables}
      />
      <StatCard label="Cuts" value={cuts} href={links?.cuts} />
    </div>
  );
}
