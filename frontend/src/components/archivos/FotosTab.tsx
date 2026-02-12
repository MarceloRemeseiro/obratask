'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { archivosApi } from '@/lib/api';
import { Archivo, TipoArchivo } from '@/types';
import { Camera, Upload, Trash2, Download, X, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';

interface FotosTabProps {
  obraId: string;
}

export function FotosTab({ obraId }: FotosTabProps) {
  const [fotos, setFotos] = useState<Archivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFoto, setSelectedFoto] = useState<Archivo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const loadFotos = async () => {
    try {
      const data = await archivosApi.getAll({
        obraId,
        tipoArchivo: TipoArchivo.FOTO
      });
      setFotos(data);
    } catch (error) {
      console.error('Error loading fotos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFotos();
  }, [obraId]);

  const uploadFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    setUploading(true);
    try {
      await Promise.all(
        imageFiles.map(file =>
          archivosApi.upload(file, { obraId })
        )
      );
      loadFotos();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      uploadFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [obraId]);

  const handleDownload = async (foto: Archivo) => {
    try {
      const url = await archivosApi.getSignedUrl(foto.id);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading:', error);
    }
  };

  const handleDelete = async (foto: Archivo) => {
    if (!confirm('¿Eliminar esta foto?')) return;
    try {
      await archivosApi.delete(foto.id);
      setSelectedFoto(null);
      loadFotos();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Cargando fotos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fotos</h2>
        <div className="flex gap-2">
          {/* Camera button - only visible on mobile */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="md:hidden"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camara
          </Button>
          <Button
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Subiendo...' : 'Subir'}
          </Button>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop zone / Gallery */}
      <div
        className={`relative min-h-[200px] rounded-lg border-2 border-dashed transition-colors ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {fotos.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-2 opacity-50" />
            <p>No hay fotos</p>
            <p className="text-sm">Arrastra imagenes aqui o usa los botones</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2">
            {fotos.map((foto) => (
              <div
                key={foto.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-muted"
                onClick={() => setSelectedFoto(foto)}
              >
                <Image
                  src={foto.url}
                  alt={foto.nombreOriginal}
                  fill
                  sizes="(max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">Ver</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center rounded-lg">
            <p className="text-primary font-medium">Suelta las imagenes aqui</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!selectedFoto} onOpenChange={() => setSelectedFoto(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedFoto?.nombreOriginal || 'Vista de foto'}
          </DialogTitle>
          {selectedFoto && (
            <div className="relative">
              <div className="relative w-full" style={{ height: '80vh' }}>
                <Image
                  src={selectedFoto.url}
                  alt={selectedFoto.nombreOriginal}
                  fill
                  sizes="100vw"
                  className="object-contain bg-black"
                  unoptimized
                  priority
                />
              </div>
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => handleDownload(selectedFoto)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => handleDelete(selectedFoto)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 bg-background">
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedFoto.createdAt), "dd 'de' MMMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
