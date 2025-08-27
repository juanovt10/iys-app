'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import BackButton from "@/components/BackButton";
import DeliverableDownloadButton from "@/components/DeliverableDownloadButton";
import { 
  buildDeliverableAPIData, 
  getDeliverableAPIFiles, 
  saveDeliverableData
} from '@/lib/supabase/apiService';
import { createClient } from '@/lib/supabase/client';

interface DeliverableDetailClientProps {
  header: {
    id: number;
    project_id: number;
    deliverable_no: number;
    created_at: string;
    created_by?: string;
    excel_file?: string;
    pdf_file?: string;
  };
  project: {
    id: string;
    name: string;
    project_client: string;
    quote_numero: number;
    latest_revision: number;
  } | null;
  lines: Array<{
    descripcion: string;
    unidad: string | null;
    qty: number;
  }>;
  projectId: string;
}

export default function DeliverableDetailClient({
  header,
  project,
  lines,
  projectId
}: DeliverableDetailClientProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<{ excelUrl: string; pdfUrl: string } | null>(null);
  
  const supabase = createClient();

  const fmt = (n: number) =>
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 }).format(n || 0);

  const handleGenerateDocuments = async () => {
    if (!project) return;
    
    setIsGenerating(true);
    
    try {
      // Build the API data
      const apiData = await buildDeliverableAPIData(header.id, projectId, supabase);
      
      // Generate documents via API
      const files = await getDeliverableAPIFiles(apiData);
      
      // Update deliverable with file URLs
      await saveDeliverableData({
        id: header.id,
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
  const excelFile = generatedFiles?.excelUrl || header.excel_file;
  const pdfFile = generatedFiles?.pdfUrl || header.pdf_file;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Acta de Entrega #{header.deliverable_no}
          </h1>
          <p className="text-sm text-muted-foreground">
            Proyecto: <span className="font-medium">{project?.name}</span>{" "}
            {project?.project_client ? <>· Cliente: <span className="font-medium">{project.project_client}</span></> : null}
          </p>
          <div className="text-xs text-muted-foreground">
            {new Date(header.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
            {header.created_by ? <> · by {header.created_by}</> : null}
          </div>
        </div>
        <div className="flex gap-2">
          <BackButton fallbackHref={`/projects/${projectId}`} />
          <DeliverableDownloadButton
            excelFile={excelFile}
            pdfFile={pdfFile}
            onGenerateDocuments={handleGenerateDocuments}
            isGenerating={isGenerating}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-base">Items entregados</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="w-24 text-center">Unidad</TableHead>
                  <TableHead className="w-28 text-center">Cantidad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      No lines.
                    </TableCell>
                  </TableRow>
                ) : (
                  lines.map((ln, i) => (
                    <TableRow key={i}>
                      <TableCell>{ln.descripcion}</TableCell>
                      <TableCell className="text-center">{ln.unidad ?? ""}</TableCell>
                      <TableCell className="text-center tabular-nums">{fmt(Number(ln.qty ?? 0))}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


    </div>
  );
}
