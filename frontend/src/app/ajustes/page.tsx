'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Database, Image, FileText, Download, Upload, Loader2 } from 'lucide-react';
import { backupApi } from '@/lib/api';

type BackupStatus = 'idle' | 'loading' | 'success' | 'error';

interface BackupSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  accept: string;
  onExport: () => Promise<Blob>;
  onImport: (file: File) => Promise<any>;
  exportFilename: string;
}

function BackupSection({
  icon,
  title,
  description,
  accept,
  onExport,
  onImport,
  exportFilename,
}: BackupSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportStatus, setExportStatus] = useState<BackupStatus>('idle');
  const [importStatus, setImportStatus] = useState<BackupStatus>('idle');
  const [message, setMessage] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleExport = async () => {
    setExportStatus('loading');
    setMessage('');
    try {
      const blob = await onExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportStatus('success');
      setMessage('Exportado correctamente');
    } catch (error: any) {
      setExportStatus('error');
      setMessage(error.message || 'Error al exportar');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setConfirmOpen(true);
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;
    setConfirmOpen(false);
    setImportStatus('loading');
    setMessage('');
    try {
      const result = await onImport(pendingFile);
      setImportStatus('success');
      if (result.counts) {
        const total = Object.values(result.counts as Record<string, number>).reduce(
          (a: number, b: number) => a + b,
          0,
        );
        setMessage(`Importado: ${total} registros`);
      } else if (result.count !== undefined) {
        setMessage(`Importado: ${result.count} archivos`);
      } else {
        setMessage('Importado correctamente');
      }
    } catch (error: any) {
      setImportStatus('error');
      setMessage(error.message || 'Error al importar');
    } finally {
      setPendingFile(null);
    }
  };

  const isLoading = exportStatus === 'loading' || importStatus === 'loading';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-2">
          <div className="p-2 rounded-lg bg-muted">{icon}</div>
          <div>
            <CardTitle className="text-lg">{title}</CardTitle>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {exportStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              variant="outline"
              className="flex-1"
            >
              {importStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          {message && (
            <p
              className={`text-sm ${
                exportStatus === 'error' || importStatus === 'error'
                  ? 'text-destructive'
                  : 'text-green-600 dark:text-green-400'
              }`}
            >
              {message}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar importacion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Esto reemplazara todos los datos existentes de <strong>{title.toLowerCase()}</strong>.
            Esta accion no se puede deshacer.
          </p>
          {pendingFile && (
            <p className="text-sm">
              Archivo: <strong>{pendingFile.name}</strong> (
              {(pendingFile.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleConfirmImport}>
              Importar y reemplazar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AjustesPage() {
  const date = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Ajustes</h1>
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-lg font-semibold">Copias de seguridad</h2>

        <BackupSection
          icon={<Database className="h-5 w-5" />}
          title="Datos"
          description="Exporta o importa todas las tablas de la base de datos como JSON"
          accept=".json"
          onExport={backupApi.exportData}
          onImport={backupApi.importData}
          exportFilename={`backup-datos-${date}.json`}
        />

        <BackupSection
          icon={<Image className="h-5 w-5" />}
          title="Fotos"
          description="Exporta o importa todas las fotos como archivo ZIP"
          accept=".zip"
          onExport={backupApi.exportFotos}
          onImport={backupApi.importFotos}
          exportFilename={`backup-fotos-${date}.zip`}
        />

        <BackupSection
          icon={<FileText className="h-5 w-5" />}
          title="Documentos"
          description="Exporta o importa todos los documentos como archivo ZIP"
          accept=".zip"
          onExport={backupApi.exportDocumentos}
          onImport={backupApi.importDocumentos}
          exportFilename={`backup-documentos-${date}.zip`}
        />
      </div>
    </div>
  );
}
