'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Upload, FileText } from 'lucide-react';
import { archivosApi } from '@/lib/api';

interface ArchivoUploadModalProps {
  obraId: string;
  onSuccess?: () => void;
}

export function ArchivoUploadModal({ obraId, onSuccess }: ArchivoUploadModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!titulo) {
        setTitulo(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      await archivosApi.upload(file, {
        obraId,
        titulo: titulo || file.name,
        descripcion: descripcion || undefined,
      });
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitulo('');
    setDescripcion('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Subir Archivo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[425px] w-[calc(100vw-2rem)]">
        <div className="flex flex-col gap-4 w-full overflow-hidden">
          <DialogHeader>
            <DialogTitle>Subir Archivo</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2 w-full">
              <Label>Archivo</Label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="flex items-center gap-2 w-full overflow-hidden">
                    <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                    <div className="text-left overflow-hidden min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Click para seleccionar archivo
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.zip,.rar"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="titulo">Titulo</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Nombre del documento"
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripcion opcional del archivo"
                rows={2}
                className="w-full"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !file}>
                {loading ? 'Subiendo...' : 'Subir'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
