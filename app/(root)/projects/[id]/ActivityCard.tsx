"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCcw } from "lucide-react";
import type { ActivityItem } from "@/types";

export default function ActivityCard({ items }: { items: ActivityItem[] }) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent activity</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.refresh()}
            className="gap-1"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground">No activity yet.</div>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between border-b py-2 last:border-none"
              >
                <div className="capitalize">{a.event_type.replace(/_/g, " ")}</div>
                <time className="text-xs text-muted-foreground">
                  {new Date(a.occurred_at)
                    .toISOString()
                    .slice(0, 16)
                    .replace("T", " ")}{" "}
                  UTC
                </time>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
