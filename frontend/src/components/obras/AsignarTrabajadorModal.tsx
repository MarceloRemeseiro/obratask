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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, AlertTriangle, Palmtree, Clock } from 'lucide-react';
import { obrasApi, trabajadoresApi } from '@/lib/api';
import { Trabajador, AsignarTrabajadorDto, ObraTrabajador } from '@/types';

interface AsignarTrabajadorModalProps {
  obraId: string;
  onSuccess?: () => void;
}

export function AsignarTrabajadorModal({
  obraId,
  onSuccess,
}: AsignarTrabajadorModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [formData, setFormData] = useState<AsignarTrabajadorDto>({
    trabajadorId: '',
    fechaInicio: '',
    fechaFin: '',
    notas: '',
  });

  // Result dialogs
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [warningDialogOpen, setWarningDialogOpen] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');

  useEffect(() => {
    if (open) {
      trabajadoresApi.getAll().then(setTrabajadores);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await obrasApi.asignarTrabajador(obraId, formData) as ObraTrabajador & { warning?: string };
      setOpen(false);
      setFormData({ trabajadorId: '', fechaInicio: '', fechaFin: '', notas: '' });

      // Check if there's a warning (worker assigned to another obra)
      if (result.warning) {
        setWarningMessage(result.warning);
        setWarningDialogOpen(true);
      }
      // Check if the assignment is pending confirmation (worker was on baja)
      else if (result.pendienteConfirmacion) {
        setPendingConfirmation(true);
        setSuccessDialogOpen(true);
      } else {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : 'Error al asignar trabajador';

      // Check if it's a conflict error (worker has vacaciones/permisos)
      if (message.includes('vacaciones') || message.includes('permisos') || message.includes('programadas')) {
        setOpen(false);
        setErrorMessage(message);
        setErrorDialogOpen(true);
      } else {
        alert(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessDialogOpen(false);
    setPendingConfirmation(false);
    onSuccess?.();
  };

  const handleWarningClose = () => {
    setWarningDialogOpen(false);
    setWarningMessage('');
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4 mr-2" />
          Asignar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asignar Trabajador</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="trabajador">Trabajador</Label>
            <Select
              value={formData.trabajadorId}
              onValueChange={(value) =>
                setFormData({ ...formData, trabajadorId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar trabajador" />
              </SelectTrigger>
              <SelectContent>
                {trabajadores.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre} {t.cargo && `- ${t.cargo}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={formData.fechaInicio}
                onChange={(e) =>
                  setFormData({ ...formData, fechaInicio: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={formData.fechaFin}
                onChange={(e) =>
                  setFormData({ ...formData, fechaFin: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) =>
                setFormData({ ...formData, notas: e.target.value })
              }
              rows={2}
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
            <Button type="submit" disabled={loading || !formData.trabajadorId}>
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Error Dialog - Worker has vacaciones/permisos */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Palmtree className="h-5 w-5" />
              No se puede asignar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {errorMessage}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                El trabajador tiene ausencias programadas (vacaciones, permisos, etc.)
                que coinciden con las fechas de asignación.
              </p>
              <p className="mt-2">
                Puedes modificar las fechas de asignación o cancelar las ausencias
                desde el perfil del trabajador.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setErrorDialogOpen(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Dialog - Worker assigned but pending confirmation (was on baja) */}
      <Dialog open={successDialogOpen} onOpenChange={(open) => !open && handleSuccessClose()}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <Clock className="h-5 w-5" />
              Asignación pendiente de confirmar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                El trabajador ha sido asignado, pero actualmente está de baja.
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>
                La asignación quedará marcada como <strong>"Pendiente de confirmar"</strong> hasta
                que el trabajador se reincorpore.
              </p>
              <p>
                Recuerda confirmar la disponibilidad del trabajador cuando se acerque
                la fecha de inicio de la asignación.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSuccessClose}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warning Dialog - Worker also assigned to another obra */}
      <Dialog open={warningDialogOpen} onOpenChange={(open) => !open && handleWarningClose()}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Trabajador asignado en otra obra
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {warningMessage}
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                La asignación se ha creado correctamente, pero ten en cuenta que el trabajador
                podría tener conflictos de horario con las otras obras asignadas.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleWarningClose}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
