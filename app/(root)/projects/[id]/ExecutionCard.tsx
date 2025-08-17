"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export default function ExecutionCard({ progressPct }: { progressPct: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Execution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-center gap-3">
          <Progress value={progressPct} className="h-2 flex-1" />
          <span className="w-12 text-right text-sm tabular-nums">
            {progressPct}%
          </span>
        </div>
        {/* Future: per-item breakdown table or mini list */}
      </CardContent>
    </Card>
  );
}
