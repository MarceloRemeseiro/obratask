'use client';

import { useState } from 'react';
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
import { Plus } from 'lucide-react';
import { obrasApi } from '@/lib/api';
import { Obra, CreateObraDto } from '@/types';

interface ObraFormProps {
  obra?: Obra;
  onSuccess?: () => void;
}

export function ObraForm({ obra, onSuccess }: ObraFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateObraDto>({
    nombre: obra?.nombre || '',
    descripcion: obra?.descripcion || '',
    fechaInicioPrev: obra?.fechaInicioPrev?.split('T')[0] || '',
    fechaFinPrev: obra?.fechaFinPrev?.split('T')[0] || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (obra) {
        await obrasApi.update(obra.id, formData);
      } else {
        await obrasApi.create(formData);
      }
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {obra ? (
          <Button variant="outline" size="sm">
            Editar
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Obra
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{obra ? 'Editar Obra' : 'Nueva Obra'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicioPrev">Fecha inicio prevista</Label>
              <Input
                id="fechaInicioPrev"
                type="date"
                value={formData.fechaInicioPrev}
                onChange={(e) =>
                  setFormData({ ...formData, fechaInicioPrev: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFinPrev">Fecha fin prevista</Label>
              <Input
                id="fechaFinPrev"
                type="date"
                value={formData.fechaFinPrev}
                onChange={(e) =>
                  setFormData({ ...formData, fechaFinPrev: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
