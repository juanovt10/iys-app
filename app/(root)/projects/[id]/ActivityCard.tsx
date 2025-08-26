// app/projects/[id]/ActivityCard.tsx (client)
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw, ExternalLink } from "lucide-react";
import { ActivityItem } from "@/types";


export default function ActivityCard({ items }: { items: ActivityItem[] }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Actividad Reciente</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => router.refresh()} className="gap-1">
            <RefreshCcw className="h-4 w-4" /> Refrescar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 border-b py-2 last:border-none">
                <div className="min-w-0">
                  <div className="truncate">{a.label}</div>
                  {a.actor ? (
                    <div className="text-xs text-muted-foreground truncate">
                      by {a.actor}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <time className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.occurred_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </time>
                  {a.href ? (
                    <Button asChild variant="outline" size="sm" className="gap-1">
                      <Link href={a.href}>
                        <ExternalLink className="h-4 w-4" />
                        Ver
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
