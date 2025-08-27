'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BackButton from "@/components/BackButton";
import CutDownloadButton from "@/components/CutDownloadButton";
import { 
  buildCutAPIData, 
  getCutAPIFiles, 
  saveCutData
} from '@/lib/supabase/apiService';
import { createClient } from '@/lib/supabase/client';
import { calculateTotals, formatWithCommas } from "@/lib/utils";

interface CutDetailClientProps {
  cut: {
    id: number | string;
    project_id: number | string;
    cut_no: number;
    status: string;
    total_amount: number | string | null;
    created_at: string;
    is_final?: boolean;
    excel_file?: string | null;
    pdf_file?: string | null;
  };
  project: {
    id: number | string;
    name: string;
    project_client: string | null;
    quote_numero: number;
    latest_revision: number;
  } | null;
  lines: Array<{
    descripcion: string;
    unidad: string | null;
    qty: number | string | null;
    unit_price: number | string | null;
    line_total: number | string | null;
  }>;
  projectId: string;
}

export default function CutDetailClient({
  cut,
  project,
  lines,
  projectId
}: CutDetailClientProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<{ excelUrl: string; pdfUrl: string } | null>(null);
  
  const supabase = createClient();

  const money = (n: number | string | null | undefined) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(Number(n || 0));
  const num = (n: number | string | null | undefined) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(Number(n || 0));

  const handleGenerateDocuments = async () => {
    if (!project) return;
    
    setIsGenerating(true);
    
    try {
      // Build the API data
      const apiData = await buildCutAPIData(Number(cut.id), projectId, supabase);
      
      // Generate documents via API
      const files = await getCutAPIFiles(apiData);
      
      // Update cut with file URLs
      await saveCutData({
        id: cut.id,
        excel_file: files.excelUrl,
        pdf_file: files.pdfUrl
      });
      
      setGeneratedFiles(files);
    } catch (error) {
      console.error('Error generating documents:', error);
      // You might want to show an error toast here
    } finally {
      setIsGenerating(false);
    }
  };

  // Use generated files if available, otherwise use stored files
  const excelFile = generatedFiles?.excelUrl || cut.excel_file;
  const pdfFile = generatedFiles?.pdfUrl || cut.pdf_file;

  // Calculate totals using the same logic as quotes
  const itemsForCalculation = lines.map(line => ({
    id: 0, // Placeholder ID
    descripcion: line.descripcion,
    unidad: line.unidad || '',
    precio_unidad: Number(line.unit_price || 0),
    cantidad: Number(line.qty || 0),
    categoria: '',
    codigo: '',
    tamano: '',
    color: '',
    forma: '',
    imagen: ''
  }));

  const { subtotal, aiu20, iva, total } = calculateTotals(itemsForCalculation);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            {cut.is_final ? "Corte Final" : `Corte #${cut.cut_no}`}
          </h1>
          <div className="text-sm text-muted-foreground">
            <span>
              Proyecto: <span className="font-medium">{project?.name ?? "—"}</span>
            </span>
            {project?.project_client ? (
              <> · Cliente: <span className="font-medium">{project.project_client}</span></>
            ) : null}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(cut.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <BackButton fallbackHref={`/projects/${projectId}`} />
          <CutDownloadButton
            excelFile={excelFile}
            pdfFile={pdfFile}
            onGenerateDocuments={handleGenerateDocuments}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Items del corte</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24 text-center">Unidad</TableHead>
                  <TableHead className="w-28 text-center">Cantidad</TableHead>
                  <TableHead className="w-32 text-right">Precio Unit.</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm text-muted-foreground">
                      No items.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((line, i) => (
                    <TableRow key={i}>
                      <TableCell>{line.descripcion}</TableCell>
                      <TableCell className="text-center">{line.unidad ?? ""}</TableCell>
                      <TableCell className="text-center tabular-nums">{num(Number(line.qty ?? 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(Number(line.unit_price ?? 0))}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(Number(line.line_total ?? 0))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Totales</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="tabular-nums">{money(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>AIU (20%):</span>
              <span className="tabular-nums">{money(aiu20)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA:</span>
              <span className="tabular-nums">{money(iva)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span className="tabular-nums">{money(total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
