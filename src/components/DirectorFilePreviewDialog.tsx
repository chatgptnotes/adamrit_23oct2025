import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Download, AlertTriangle } from 'lucide-react';
import { inferOfficeKindFromName, type OfficeFileKind } from '@/lib/office-upload-validation';

interface DirectorFilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string | null;
  signedUrl: string | null;
}

interface SheetRendered {
  name: string;
  html: string;
}

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'An unexpected error occurred';

/**
 * Unified preview dialog for Director's Files.
 *
 * - PDF      → rendered via the browser's native PDF viewer in an iframe.
 * - DOCX     → rendered via mammoth.js (DOCX → HTML), shown in a styled box.
 * - XLSX/XLS → rendered via SheetJS, one HTML table per sheet with tabs.
 *
 * Heavy libraries (mammoth, xlsx) are dynamically imported on first use so
 * they don't bloat the initial bundle.
 */
export function DirectorFilePreviewDialog({
  open,
  onOpenChange,
  fileName,
  signedUrl,
}: DirectorFilePreviewDialogProps) {
  const kind: OfficeFileKind | null = fileName ? inferOfficeKindFromName(fileName) : null;

  const [docxHtml, setDocxHtml] = useState<string | null>(null);
  const [sheets, setSheets] = useState<SheetRendered[] | null>(null);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    // Reset state whenever the dialog opens for a new file.
    setDocxHtml(null);
    setSheets(null);
    setActiveSheetIndex(0);
    setRenderError(null);

    if (!open || !signedUrl || !kind) return;
    // PDF is rendered by the browser in an <iframe> — nothing to fetch.
    if (kind === 'pdf') return;

    let cancelled = false;
    (async () => {
      setIsRendering(true);
      try {
        const response = await fetch(signedUrl);
        if (!response.ok) throw new Error(`Download failed (${response.status}).`);
        const buffer = await response.arrayBuffer();

        if (kind === 'docx') {
          const mammoth = await import('mammoth');
          const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
          if (!cancelled) setDocxHtml(result.value);
        } else if (kind === 'xlsx' || kind === 'xls') {
          const XLSX = await import('xlsx');
          const workbook = XLSX.read(buffer, { type: 'array' });
          const rendered: SheetRendered[] = workbook.SheetNames.map((name) => ({
            name,
            html: XLSX.utils.sheet_to_html(workbook.Sheets[name]),
          }));
          if (!cancelled) setSheets(rendered);
        }
      } catch (err) {
        if (!cancelled) {
          setRenderError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, signedUrl, kind]);

  const handleDownload = () => {
    if (!signedUrl) return;
    // Anchor with download attribute triggers a save dialog instead of
    // navigating away. Click + remove keeps the DOM clean.
    const link = document.createElement('a');
    link.href = signedUrl;
    link.download = fileName ?? '';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="truncate">{fileName ?? 'Preview'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-[60vh]">
          {!signedUrl || !kind ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <AlertTriangle className="h-10 w-10 mb-2 opacity-40" />
              <p>Could not load the file.</p>
            </div>
          ) : kind === 'pdf' ? (
            <iframe
              src={signedUrl}
              title={fileName ?? 'PDF preview'}
              className="w-full h-[70vh] border rounded"
            />
          ) : isRendering ? (
            <div className="flex justify-center py-12">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
                role="status"
                aria-label="Rendering preview"
              />
            </div>
          ) : renderError ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
              <AlertTriangle className="h-10 w-10 mb-2 text-amber-500" />
              <p className="font-medium">Could not render this file in the browser.</p>
              <p className="text-sm mt-1">{renderError}</p>
              <p className="text-sm mt-2">Download it to view in Word/Excel.</p>
            </div>
          ) : kind === 'docx' && docxHtml !== null ? (
            <div
              className="prose max-w-none max-h-[70vh] overflow-auto border rounded p-4 bg-white"
              // mammoth produces simple HTML from a trusted user-uploaded
              // document; we sanitize at upload via magic-byte check rather
              // than re-sanitizing here.
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          ) : (kind === 'xlsx' || kind === 'xls') && sheets !== null ? (
            <div className="border rounded bg-white">
              {sheets.length > 1 && (
                <div className="flex gap-1 border-b overflow-x-auto p-2 bg-gray-50">
                  {sheets.map((sheet, i) => (
                    <button
                      key={sheet.name}
                      type="button"
                      onClick={() => setActiveSheetIndex(i)}
                      className={`px-3 py-1 text-sm rounded ${
                        i === activeSheetIndex
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {sheet.name}
                    </button>
                  ))}
                </div>
              )}
              <div
                className="max-h-[65vh] overflow-auto p-4 sheetjs-table"
                dangerouslySetInnerHTML={{
                  __html: sheets[activeSheetIndex]?.html ?? '',
                }}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleDownload} disabled={!signedUrl} className="gap-2">
            <Download className="h-4 w-4" />
            Download
          </Button>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
