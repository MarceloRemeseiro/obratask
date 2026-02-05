'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { obrasApi } from '@/lib/api';
import { ObraTrabajador } from '@/types';

interface EditAsignacionModalProps {
  obraId: string;
  asignacion: ObraTrabajador | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditAsignacionModal({
  obraId,
  asignacion,
  open,
  onOpenChange,
  onSuccess,
}: EditAsignacionModalProps) {
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (asignacion) {
      setFechaInicio(asignacion.fechaInicio?.split('T')[0] || '');
      setFechaFin(asignacion.fechaFin?.split('T')[0] || '');
      setNotas(asignacion.notas || '');
    }
  }, [asignacion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asignacion) return;

    setLoading(true);
    try {
      const dataToSend: Record<string, string> = {};
      if (fechaInicio) dataToSend.fechaInicio = fechaInicio;
      if (fechaFin) dataToSend.fechaFin = fechaFin;
      if (notas) dataToSend.notas = notas;

      await obrasApi.updateAsignacion(obraId, asignacion.id, dataToSend);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Editar Asignacion
            {asignacion?.trabajador?.nombre && (
              <span className="font-normal text-muted-foreground">
                {' - '}{asignacion.trabajador.nombre}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Notas sobre la asignación"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
