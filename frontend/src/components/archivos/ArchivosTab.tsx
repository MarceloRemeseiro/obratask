'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArchivoUploadModal } from './ArchivoUploadModal';
import { ArchivoEditModal } from './ArchivoEditModal';
import { archivosApi } from '@/lib/api';
import { Archivo, TipoArchivo } from '@/types';
import { FileText, Download, Trash2, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ArchivosTabProps {
  obraId: string;
}

export function ArchivosTab({ obraId }: ArchivosTabProps) {
  const [archivos, setArchivos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingArchivo, setEditingArchivo] = useState<Archivo | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const loadArchivos = async () => {
    try {
      const data = await archivosApi.getAll({
        obraId,
        tipoArchivo: TipoArchivo.DOCUMENTO
      });
      setArchivos(data);
    } catch (error) {
      console.error('Error loading archivos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivos();
  }, [obraId]);

  const handleDownload = async (archivo: Archivo) => {
    try {
      const url = await archivosApi.getSignedUrl(archivo.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleDelete = async (archivo: Archivo) => {
    if (!confirm(`¿Eliminar "${archivo.titulo || archivo.nombreOriginal}"?`)) return;
    try {
      await archivosApi.delete(archivo.id);
      loadArchivos();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleEdit = (archivo: Archivo) => {
    setEditingArchivo(archivo);
    setEditModalOpen(true);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Cargando archivos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <ArchivoUploadModal obraId={obraId} onSuccess={loadArchivos} />
      </div>

      {archivos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No hay documentos</p>
            <p className="text-sm">Sube archivos PDF, Word, Excel...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {archivos.map((archivo) => (
            <Card key={archivo.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <FileText className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {archivo.titulo || archivo.nombreOriginal}
                    </p>
                    {archivo.descripcion && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {archivo.descripcion}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{formatFileSize(archivo.tamanio)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(archivo.createdAt), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(archivo)}
                      title="Descargar"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(archivo)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(archivo)}
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ArchivoEditModal
        archivo={editingArchivo}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onSuccess={loadArchivos}
      />
    </div>
  );
}
