'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trabajadoresApi } from '@/lib/api';
import {
  Trabajador,
  CreateTrabajadorDto,
  TrabajadorAusencia,
  CreateAusenciaDto,
  TipoContrato,
  TipoAusencia,
  TipoCarnet,
} from '@/types';
import {
  Plus,
  Phone,
  Mail,
  Building2,
  Edit,
  Trash2,
  MoreVertical,
  HardHat,
  Palmtree,
  Stethoscope,
  AlertTriangle,
  Calendar,
  Car,
  ShieldCheck,
  HeartPulse,
  X,
  Users,
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, differenceInDays, isBefore, startOfYear, endOfYear } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

const tipoContratoLabels: Record<TipoContrato, string> = {
  [TipoContrato.INDEFINIDO]: 'Indefinido',
  [TipoContrato.TEMPORAL]: 'Temporal',
  [TipoContrato.AUTONOMO]: 'Autónomo',
  [TipoContrato.PRACTICAS]: 'Prácticas',
};

const tipoAusenciaLabels: Record<TipoAusencia, string> = {
  [TipoAusencia.VACACIONES]: 'Vacaciones',
  [TipoAusencia.BAJA_ENFERMEDAD]: 'Baja enfermedad',
  [TipoAusencia.BAJA_ACCIDENTE]: 'Baja accidente',
  [TipoAusencia.PERMISO]: 'Permiso',
  [TipoAusencia.OTRO]: 'Otro',
};

// Tipos que son "bajas" (requieren dar de alta)
const tiposBaja = [TipoAusencia.BAJA_ENFERMEDAD, TipoAusencia.BAJA_ACCIDENTE];

function esBajaActiva(ausencia: TrabajadorAusencia): boolean {
  return tiposBaja.includes(ausencia.tipo) && !ausencia.fechaFin;
}

const tipoAusenciaIcons: Record<TipoAusencia, typeof Palmtree> = {
  [TipoAusencia.VACACIONES]: Palmtree,
  [TipoAusencia.BAJA_ENFERMEDAD]: Stethoscope,
  [TipoAusencia.BAJA_ACCIDENTE]: HeartPulse,
  [TipoAusencia.PERMISO]: Calendar,
  [TipoAusencia.OTRO]: Calendar,
};

function getEstadoActual(trabajador: Trabajador): { tipo: 'trabajando' | 'ausente'; ausencia?: TrabajadorAusencia } {
  const hoy = startOfDay(new Date());
  const ausenciaActual = trabajador.ausencias?.find((a) => {
    const inicio = startOfDay(parseISO(a.fechaInicio));
    const fin = a.fechaFin ? startOfDay(parseISO(a.fechaFin)) : inicio;
    return isWithinInterval(hoy, { start: inicio, end: fin });
  });

  if (ausenciaActual) {
    return { tipo: 'ausente', ausencia: ausenciaActual };
  }
  return { tipo: 'trabajando' };
}

function getDiasVacacionesUsados(trabajador: Trabajador, year: number = new Date().getFullYear()): number {
  const inicio = startOfYear(new Date(year, 0, 1));
  const fin = endOfYear(new Date(year, 0, 1));

  return trabajador.ausencias
    ?.filter((a) => a.tipo === TipoAusencia.VACACIONES)
    .reduce((total, a) => {
      const fechaInicio = parseISO(a.fechaInicio);
      const fechaFin = a.fechaFin ? parseISO(a.fechaFin) : fechaInicio;

      // Solo contar días dentro del año
      const inicioEfectivo = isBefore(fechaInicio, inicio) ? inicio : fechaInicio;
      const finEfectivo = isBefore(fin, fechaFin) ? fin : fechaFin;

      if (isBefore(finEfectivo, inicioEfectivo)) return total;

      return total + differenceInDays(finEfectivo, inicioEfectivo) + 1;
    }, 0) || 0;
}

function getDiasBaja(trabajador: Trabajador): number {
  return trabajador.ausencias
    ?.filter((a) => a.tipo === TipoAusencia.BAJA_ENFERMEDAD || a.tipo === TipoAusencia.BAJA_ACCIDENTE)
    .reduce((total, a) => {
      const fechaInicio = parseISO(a.fechaInicio);
      const fechaFin = a.fechaFin ? parseISO(a.fechaFin) : new Date();
      return total + differenceInDays(fechaFin, fechaInicio) + 1;
    }, 0) || 0;
}

function getAlertasDocumentos(trabajador: Trabajador): string[] {
  const alertas: string[] = [];
  const hoy = new Date();
  const en30Dias = new Date();
  en30Dias.setDate(en30Dias.getDate() + 30);

  if (trabajador.reconocimientoMedicoVencimiento) {
    const fecha = parseISO(trabajador.reconocimientoMedicoVencimiento);
    if (isBefore(fecha, hoy)) {
      alertas.push('Reconocimiento médico vencido');
    } else if (isBefore(fecha, en30Dias)) {
      alertas.push('Reconocimiento médico próximo a vencer');
    }
  }

  if (trabajador.formacionPRLVencimiento) {
    const fecha = parseISO(trabajador.formacionPRLVencimiento);
    if (isBefore(fecha, hoy)) {
      alertas.push('Formación PRL vencida');
    } else if (isBefore(fecha, en30Dias)) {
      alertas.push('Formación PRL próxima a vencer');
    }
  }

  if (trabajador.carnetConducirVencimiento) {
    const fecha = parseISO(trabajador.carnetConducirVencimiento);
    if (isBefore(fecha, hoy)) {
      alertas.push('Carnet de conducir vencido');
    } else if (isBefore(fecha, en30Dias)) {
      alertas.push('Carnet de conducir próximo a vencer');
    }
  }

  if (trabajador.fechaFinContrato) {
    const fecha = parseISO(trabajador.fechaFinContrato);
    if (isBefore(fecha, hoy)) {
      alertas.push('Contrato finalizado');
    } else if (isBefore(fecha, en30Dias)) {
      alertas.push('Contrato próximo a finalizar');
    }
  }

  return alertas;
}

export default function TrabajadoresPage() {
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [ausenciaDialogOpen, setAusenciaDialogOpen] = useState(false);
  const [ausenciaMode, setAusenciaMode] = useState<'vacaciones' | 'baja'>('vacaciones');
  const [altaDialogOpen, setAltaDialogOpen] = useState(false);
  const [ausenciaParaAlta, setAusenciaParaAlta] = useState<{ trabajadorId: string; ausencia: TrabajadorAusencia } | null>(null);
  const [fechaAlta, setFechaAlta] = useState('');
  const [selectedTrabajador, setSelectedTrabajador] = useState<Trabajador | null>(null);
  // Conflict dialog
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');
  // Baja warning dialog (for affected assignments)
  const [bajaWarningDialogOpen, setBajaWarningDialogOpen] = useState(false);
  const [asignacionesAfectadas, setAsignacionesAfectadas] = useState<
    { id: string; obraId: string; obraNombre: string; fechaInicio: string; fechaFin?: string }[]
  >([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTrabajadorDto>({
    nombre: '',
    cargo: '',
    telefono: '',
    email: '',
  });
  const [ausenciaFormData, setAusenciaFormData] = useState<CreateAusenciaDto>({
    tipo: TipoAusencia.VACACIONES,
    fechaInicio: '',
    fechaFin: '',
    notas: '',
  });

  const loadTrabajadores = () => {
    setLoading(true);
    trabajadoresApi
      .getAll()
      .then(setTrabajadores)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadTrabajadores();
  }, []);

  const resetForm = () => {
    setFormData({
      nombre: '',
      cargo: '',
      telefono: '',
      email: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await trabajadoresApi.create(formData);
      setDialogOpen(false);
      resetForm();
      loadTrabajadores();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  const handleAusenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrabajador) return;
    setFormLoading(true);
    try {
      // Only send fechaFin if it has a value (bajas don't have fechaFin initially)
      const dataToSend: CreateAusenciaDto = {
        tipo: ausenciaFormData.tipo,
        fechaInicio: ausenciaFormData.fechaInicio,
        notas: ausenciaFormData.notas || undefined,
      };
      if (ausenciaFormData.fechaFin) {
        dataToSend.fechaFin = ausenciaFormData.fechaFin;
      }
      const result = await trabajadoresApi.createAusencia(selectedTrabajador.id, dataToSend);

      // Check if there are affected assignments (baja with future obra assignments)
      if (result.asignacionesAfectadas && result.asignacionesAfectadas.length > 0) {
        setAsignacionesAfectadas(result.asignacionesAfectadas);
        setBajaWarningDialogOpen(true);
      }

      setAusenciaDialogOpen(false);
      setAusenciaFormData({
        tipo: TipoAusencia.VACACIONES,
        fechaInicio: '',
        fechaFin: '',
        notas: '',
      });
      loadTrabajadores();
    } catch (error) {
      console.error('Error:', error);
      const message = error instanceof Error ? error.message : 'Error al guardar la ausencia';

      // Check if it's a conflict error (worker has obra assignments)
      if (message.includes('asignaciones')) {
        setAusenciaDialogOpen(false);
        setConflictMessage(message);
        setConflictDialogOpen(true);
      } else {
        alert(message);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAusencia = async (trabajadorId: string, ausenciaId: string) => {
    if (!confirm('¿Eliminar esta ausencia?')) return;
    try {
      await trabajadoresApi.deleteAusencia(trabajadorId, ausenciaId);
      loadTrabajadores();
    } catch (error) {
      alert('Error al eliminar ausencia');
    }
  };

  const handleDarAlta = async () => {
    if (!ausenciaParaAlta || !fechaAlta) return;
    setFormLoading(true);
    try {
      await trabajadoresApi.updateAusencia(
        ausenciaParaAlta.trabajadorId,
        ausenciaParaAlta.ausencia.id,
        { fechaFin: fechaAlta }
      );
      setAltaDialogOpen(false);
      setAusenciaParaAlta(null);
      setFechaAlta('');
      loadTrabajadores();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al dar de alta');
    } finally {
      setFormLoading(false);
    }
  };

  const openAusenciaDialog = (trabajador: Trabajador, mode: 'vacaciones' | 'baja') => {
    setSelectedTrabajador(trabajador);
    setAusenciaMode(mode);
    setAusenciaFormData({
      tipo: mode === 'baja' ? TipoAusencia.BAJA_ENFERMEDAD : TipoAusencia.VACACIONES,
      fechaInicio: format(new Date(), 'yyyy-MM-dd'),
      fechaFin: '',
      notas: '',
    });
    setAusenciaDialogOpen(true);
  };

  const openAltaDialog = (trabajadorId: string, ausencia: TrabajadorAusencia) => {
    setAusenciaParaAlta({ trabajadorId, ausencia });
    setFechaAlta(format(new Date(), 'yyyy-MM-dd'));
    setAltaDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Equipo</h1>
          <p className="text-sm text-muted-foreground">{trabajadores.length} trabajadores</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Nuevo Trabajador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ej: Albañil, Electricista"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Podrás añadir más datos desde el perfil del trabajador
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? 'Guardando...' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Ausencia Dialog - Vacaciones/Permisos */}
      <Dialog open={ausenciaDialogOpen} onOpenChange={setAusenciaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {ausenciaMode === 'baja' ? 'Dar de baja' : 'Nueva ausencia'} - {selectedTrabajador?.nombre}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAusenciaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={ausenciaFormData.tipo}
                onValueChange={(v) => setAusenciaFormData({ ...ausenciaFormData, tipo: v as TipoAusencia })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ausenciaMode === 'baja' ? (
                    <>
                      <SelectItem value={TipoAusencia.BAJA_ENFERMEDAD}>Baja por enfermedad</SelectItem>
                      <SelectItem value={TipoAusencia.BAJA_ACCIDENTE}>Baja por accidente</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value={TipoAusencia.VACACIONES}>Vacaciones</SelectItem>
                      <SelectItem value={TipoAusencia.PERMISO}>Permiso</SelectItem>
                      <SelectItem value={TipoAusencia.OTRO}>Otro</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {ausenciaMode === 'baja' ? (
              <div className="space-y-2">
                <Label htmlFor="fechaInicioBaja">Fecha de baja *</Label>
                <Input
                  id="fechaInicioBaja"
                  type="date"
                  value={ausenciaFormData.fechaInicio}
                  onChange={(e) => setAusenciaFormData({ ...ausenciaFormData, fechaInicio: e.target.value })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Cuando se reincorpore, deberás dar de alta indicando la fecha
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicioAus">Desde *</Label>
                  <Input
                    id="fechaInicioAus"
                    type="date"
                    value={ausenciaFormData.fechaInicio}
                    onChange={(e) => setAusenciaFormData({ ...ausenciaFormData, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFinAus">Hasta *</Label>
                  <Input
                    id="fechaFinAus"
                    type="date"
                    value={ausenciaFormData.fechaFin || ''}
                    onChange={(e) => setAusenciaFormData({ ...ausenciaFormData, fechaFin: e.target.value })}
                    required={ausenciaMode === 'vacaciones'}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notasAus">Notas</Label>
              <Textarea
                id="notasAus"
                value={ausenciaFormData.notas || ''}
                onChange={(e) => setAusenciaFormData({ ...ausenciaFormData, notas: e.target.value })}
                rows={2}
                placeholder={ausenciaMode === 'baja' ? 'Motivo de la baja...' : ''}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAusenciaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={formLoading}>
                {formLoading ? 'Guardando...' : ausenciaMode === 'baja' ? 'Dar de baja' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alta Dialog - Para dar de alta de una baja */}
      <Dialog open={altaDialogOpen} onOpenChange={setAltaDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Dar de alta</DialogTitle>
          </DialogHeader>
          {ausenciaParaAlta && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p><strong>Tipo:</strong> {tipoAusenciaLabels[ausenciaParaAlta.ausencia.tipo]}</p>
                <p><strong>Fecha baja:</strong> {format(parseISO(ausenciaParaAlta.ausencia.fechaInicio), "d 'de' MMMM yyyy", { locale: es })}</p>
                <p><strong>Días transcurridos:</strong> {differenceInDays(new Date(), parseISO(ausenciaParaAlta.ausencia.fechaInicio)) + 1} días</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaAlta">Fecha de alta *</Label>
                <Input
                  id="fechaAlta"
                  type="date"
                  value={fechaAlta}
                  onChange={(e) => setFechaAlta(e.target.value)}
                  min={ausenciaParaAlta.ausencia.fechaInicio.split('T')[0]}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAltaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleDarAlta} disabled={formLoading || !fechaAlta}>
                  {formLoading ? 'Guardando...' : 'Confirmar alta'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog - Worker has obra assignments */}
      <Dialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              No se puede registrar la ausencia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {conflictMessage}
              </p>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Para poder registrar vacaciones o permisos en estas fechas, primero debes:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Ir al <strong>perfil del trabajador</strong></li>
                <li>Revisar las asignaciones en la pestaña <strong>Obras</strong></li>
                <li>Desasignar al trabajador de esas obras o modificar las fechas</li>
              </ol>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
                Entendido
              </Button>
              {selectedTrabajador && (
                <Button asChild>
                  <Link href={`/trabajadores/${selectedTrabajador.id}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    Ver perfil
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Baja Warning Dialog */}
      <Dialog open={bajaWarningDialogOpen} onOpenChange={setBajaWarningDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Asignaciones afectadas
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                El trabajador ha sido dado de baja correctamente. Sin embargo, tiene {asignacionesAfectadas.length} asignación{asignacionesAfectadas.length !== 1 ? 'es' : ''} a obras que han quedado <strong>pendientes de confirmación</strong>:
              </p>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {asignacionesAfectadas.map((asig) => (
                <div
                  key={asig.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium text-sm">{asig.obraNombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(asig.fechaInicio), 'dd/MM/yyyy')}
                      {asig.fechaFin && ` - ${format(parseISO(asig.fechaFin), 'dd/MM/yyyy')}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
                    Pendiente
                  </Badge>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Cuando el trabajador reciba el <strong>alta</strong>, estas asignaciones se confirmarán automáticamente.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setBajaWarningDialogOpen(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {trabajadores.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No hay trabajadores registrados</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Agrega tu primer trabajador al equipo</p>
            <Button size="sm" className="mt-4" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nuevo trabajador
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
          {trabajadores.map((trabajador) => {
            const estado = getEstadoActual(trabajador);
            const diasVacUsados = getDiasVacacionesUsados(trabajador);
            const diasVacDisponibles = trabajador.diasVacacionesAnuales - diasVacUsados;
            const diasBaja = getDiasBaja(trabajador);
            const alertas = getAlertasDocumentos(trabajador);
            const obrasActivas = trabajador.obrasTrabajador?.length || 0;
            const AusenciaIcon = estado.ausencia ? tipoAusenciaIcons[estado.ausencia.tipo] : null;

            // Check if worker has an active baja
            const bajaActiva = trabajador.ausencias?.find(a => esBajaActiva(a));

            return (
              <Card key={trabajador.id} className="overflow-hidden">
                {/* Mobile: Compact row */}
                <div className="md:hidden">
                  <div className="flex items-center gap-3 p-3">
                    {/* Status indicator */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                      estado.tipo === 'ausente' && estado.ausencia?.tipo === TipoAusencia.VACACIONES && "bg-green-100 dark:bg-green-900",
                      estado.tipo === 'ausente' && (estado.ausencia?.tipo === TipoAusencia.BAJA_ENFERMEDAD || estado.ausencia?.tipo === TipoAusencia.BAJA_ACCIDENTE) && "bg-red-100 dark:bg-red-900",
                      estado.tipo === 'ausente' && estado.ausencia?.tipo === TipoAusencia.PERMISO && "bg-blue-100 dark:bg-blue-900",
                      estado.tipo === 'trabajando' && "bg-muted"
                    )}>
                      {AusenciaIcon ? (
                        <AusenciaIcon className={cn(
                          "h-5 w-5",
                          estado.ausencia?.tipo === TipoAusencia.VACACIONES && "text-green-600 dark:text-green-400",
                          (estado.ausencia?.tipo === TipoAusencia.BAJA_ENFERMEDAD || estado.ausencia?.tipo === TipoAusencia.BAJA_ACCIDENTE) && "text-red-600 dark:text-red-400",
                          estado.ausencia?.tipo === TipoAusencia.PERMISO && "text-blue-600 dark:text-blue-400"
                        )} />
                      ) : (
                        <span className="text-sm font-medium text-muted-foreground">
                          {trabajador.nombre.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{trabajador.nombre}</span>
                        {trabajador.esEncargado && (
                          <HardHat className="h-3 w-3 text-primary shrink-0" />
                        )}
                        {alertas.length > 0 && (
                          <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {trabajador.cargo && <span className="truncate">{trabajador.cargo}</span>}
                        {trabajador.cargo && <span>•</span>}
                        <span>{diasVacDisponibles}d vac</span>
                        {diasBaja > 0 && <span className="text-red-500">• {diasBaja}d baja</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/trabajadores/${trabajador.id}`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Ver perfil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openAusenciaDialog(trabajador, 'vacaciones')}>
                          <Palmtree className="h-4 w-4 mr-2" />
                          Añadir ausencia
                        </DropdownMenuItem>
                        {!bajaActiva && (
                          <DropdownMenuItem onClick={() => openAusenciaDialog(trabajador, 'baja')}>
                            <Stethoscope className="h-4 w-4 mr-2" />
                            Dar de baja
                          </DropdownMenuItem>
                        )}
                        {bajaActiva && (
                          <DropdownMenuItem onClick={() => openAltaDialog(trabajador.id, bajaActiva)}>
                            <HeartPulse className="h-4 w-4 mr-2" />
                            Dar de alta
                          </DropdownMenuItem>
                        )}
                        {trabajador.telefono && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={`tel:${trabajador.telefono}`}>
                                <Phone className="h-4 w-4 mr-2" />
                                Llamar
                              </a>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Baja activa - prominent display with alta button */}
                  {bajaActiva && (
                    <div className="mx-3 mb-2 p-2 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-red-600 dark:text-red-400" />
                          <div className="text-xs">
                            <span className="font-medium text-red-700 dark:text-red-300">
                              {tipoAusenciaLabels[bajaActiva.tipo]}
                            </span>
                            <span className="text-red-600 dark:text-red-400 ml-2">
                              {differenceInDays(new Date(), parseISO(bajaActiva.fechaInicio)) + 1} días
                            </span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                          onClick={() => openAltaDialog(trabajador.id, bajaActiva)}
                        >
                          Dar alta
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Ausencias (excluding active bajas) */}
                  {trabajador.ausencias && trabajador.ausencias.filter(a => !esBajaActiva(a)).length > 0 && (
                    <div className="px-3 pb-3 flex gap-1 flex-wrap">
                      {trabajador.ausencias.filter(a => !esBajaActiva(a)).slice(0, 2).map((a) => {
                        const Icon = tipoAusenciaIcons[a.tipo];
                        return (
                          <Badge
                            key={a.id}
                            variant="outline"
                            className="text-[10px] gap-1 pr-1"
                          >
                            <Icon className="h-3 w-3" />
                            {format(parseISO(a.fechaInicio), 'dd/MM')}
                            {a.fechaFin && `-${format(parseISO(a.fechaFin), 'dd/MM')}`}
                            <button
                              onClick={() => handleDeleteAusencia(trabajador.id, a.id)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                      {trabajador.ausencias.filter(a => !esBajaActiva(a)).length > 2 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{trabajador.ausencias.filter(a => !esBajaActiva(a)).length - 2}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Desktop: Full card */}
                <div className="hidden md:block">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{trabajador.nombre}</CardTitle>
                        {trabajador.esEncargado && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <HardHat className="h-3 w-3" />
                            Encargado
                          </Badge>
                        )}
                        {estado.tipo === 'ausente' && AusenciaIcon && (
                          <Badge variant={
                            estado.ausencia?.tipo === TipoAusencia.VACACIONES ? 'default' :
                            estado.ausencia?.tipo === TipoAusencia.BAJA_ENFERMEDAD || estado.ausencia?.tipo === TipoAusencia.BAJA_ACCIDENTE ? 'destructive' : 'secondary'
                          } className="text-xs">
                            <AusenciaIcon className="h-3 w-3 mr-1" />
                            {tipoAusenciaLabels[estado.ausencia!.tipo]}
                          </Badge>
                        )}
                        {alertas.length > 0 && (
                          <span title={alertas.join(', ')}>
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          </span>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/trabajadores/${trabajador.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Ver perfil
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openAusenciaDialog(trabajador, 'vacaciones')}>
                            <Palmtree className="h-4 w-4 mr-2" />
                            Añadir ausencia
                          </DropdownMenuItem>
                          {!bajaActiva && (
                            <DropdownMenuItem onClick={() => openAusenciaDialog(trabajador, 'baja')}>
                              <Stethoscope className="h-4 w-4 mr-2" />
                              Dar de baja
                            </DropdownMenuItem>
                          )}
                          {bajaActiva && (
                            <DropdownMenuItem onClick={() => openAltaDialog(trabajador.id, bajaActiva)}>
                              <HeartPulse className="h-4 w-4 mr-2" />
                              Dar de alta
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {trabajador.cargo && (
                      <p className="text-sm text-muted-foreground">{trabajador.cargo}</p>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Baja activa - prominent display */}
                    {bajaActiva && (
                      <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-red-600 dark:text-red-400" />
                            <div className="text-sm">
                              <span className="font-medium text-red-700 dark:text-red-300">
                                {tipoAusenciaLabels[bajaActiva.tipo]}
                              </span>
                              <span className="text-red-600 dark:text-red-400 ml-2">
                                desde {format(parseISO(bajaActiva.fechaInicio), "d 'de' MMM", { locale: es })}
                              </span>
                              <span className="text-red-600 dark:text-red-400 ml-1">
                                ({differenceInDays(new Date(), parseISO(bajaActiva.fechaInicio)) + 1} días)
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                            onClick={() => openAltaDialog(trabajador.id, bajaActiva)}
                          >
                            Dar de alta
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="flex gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Palmtree className="h-4 w-4 text-green-600" />
                        <span>{diasVacDisponibles}/{trabajador.diasVacacionesAnuales} días</span>
                      </div>
                      {diasBaja > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <Stethoscope className="h-4 w-4" />
                          <span>{diasBaja} días baja</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{obrasActivas} obras</span>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {trabajador.telefono && (
                        <a href={`tel:${trabajador.telefono}`} className="flex items-center gap-1 hover:text-foreground">
                          <Phone className="h-3 w-3" />
                          {trabajador.telefono}
                        </a>
                      )}
                      {trabajador.email && (
                        <a href={`mailto:${trabajador.email}`} className="flex items-center gap-1 hover:text-foreground">
                          <Mail className="h-3 w-3" />
                          {trabajador.email}
                        </a>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1">
                      {trabajador.tipoContrato && (
                        <Badge variant="outline" className="text-xs">
                          {tipoContratoLabels[trabajador.tipoContrato]}
                        </Badge>
                      )}
                      {trabajador.carnetConducir && (
                        <Badge variant="outline" className="text-xs">
                          <Car className="h-3 w-3 mr-1" />
                          {trabajador.carnetConducir}
                        </Badge>
                      )}
                      {trabajador.especialidades?.map((e) => (
                        <Badge key={e} variant="secondary" className="text-xs">{e}</Badge>
                      ))}
                    </div>

                    {/* Ausencias (excluding active bajas - those are shown prominently above) */}
                    {trabajador.ausencias && trabajador.ausencias.filter(a => !esBajaActiva(a)).length > 0 && (
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Ausencias registradas</p>
                        <div className="flex flex-wrap gap-1">
                          {trabajador.ausencias.filter(a => !esBajaActiva(a)).map((a) => {
                            const Icon = tipoAusenciaIcons[a.tipo];
                            const isBajaCompletada = tiposBaja.includes(a.tipo) && a.fechaFin;
                            return (
                              <Badge
                                key={a.id}
                                variant="outline"
                                className={cn(
                                  "text-xs gap-1",
                                  isBajaCompletada && "border-red-200 dark:border-red-800"
                                )}
                              >
                                <Icon className={cn("h-3 w-3", isBajaCompletada && "text-red-500")} />
                                {format(parseISO(a.fechaInicio), 'dd MMM', { locale: es })}
                                {a.fechaFin && ` - ${format(parseISO(a.fechaFin), 'dd MMM', { locale: es })}`}
                                <button
                                  onClick={() => handleDeleteAusencia(trabajador.id, a.id)}
                                  className="ml-1 hover:text-destructive"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
