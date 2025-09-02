"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExternalLink, Search } from "lucide-react";
import CutDownloadButton from "@/components/CutDownloadButton";
import { 
  buildCutAPIData, 
  getCutAPIFiles, 
  saveCutData
} from '@/lib/supabase/apiService';
import { createClient } from '@/lib/supabase/client';

type Row = {
  id: number;
  no: number;
  status: string;
  totalAmount: number | string | null;
  date: string;
  deliverablesCount: number;
  excelFile?: string | null;
  pdfFile?: string | null;
};

export default function CutsListClient({
  projectId,
  rows,
}: {
  projectId: string;
  rows: Row[];
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"no_asc" | "date_desc">("no_asc");
  const [generatingFor, setGeneratingFor] = useState<number | null>(null);
  
  const supabase = createClient();

  const money = (n: number | string | null | undefined) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));

  const handleGenerateDocuments = async (cutId: number) => {
    setGeneratingFor(cutId);
    
    try {
      // Build the API data
      const apiData = await buildCutAPIData(cutId, projectId, supabase);
      
      // Generate documents via API
      const files = await getCutAPIFiles(apiData);
      
      // Update cut with file URLs
      await saveCutData({
        id: cutId,
        excel_file: files.excelUrl,
        pdf_file: files.pdfUrl
      });
      
      // Refresh the page to show updated files
      window.location.reload();
    } catch (error) {
      console.error('Error generating documents:', error);
      // You might want to show an error toast here
    } finally {
      setGeneratingFor(null);
    }
  };

  const filtered = useMemo(() => {
    let r = [...rows];
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      r = r.filter((x) =>
        [
          String(x.no),
          new Date(x.date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }),
          x.status,
        ]
          .join(" ")
          .toLowerCase()
          .includes(t)
      );
    }
    r.sort((a, b) =>
      sort === "no_asc"
        ? a.no - b.no
        : new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return r;
  }, [rows, q, sort]);

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar Corte..."
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">No.</TableHead>
                  <TableHead className="w-40">Fecha</TableHead>
                  <TableHead className="w-28 text-center"># Entregas</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                  <TableHead className="w-40 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No cuts yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="align-top">
                      <TableCell className="font-medium">#{c.no}</TableCell>
                      <TableCell>
                        {new Date(c.date).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell className="text-center">{c.deliverablesCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(c.totalAmount)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm" className="gap-1">
                            <Link href={`/projects/${projectId}/cuts/${c.id}`}>
                              <ExternalLink className="h-4 w-4" />
                              Ver
                            </Link>
                          </Button>
                          <CutDownloadButton
                            excelFile={c.excelFile || undefined}
                            pdfFile={c.pdfFile || undefined}
                            onGenerateDocuments={() => handleGenerateDocuments(c.id)}
                            isGenerating={generatingFor === c.id}
                            className="text-xs"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
