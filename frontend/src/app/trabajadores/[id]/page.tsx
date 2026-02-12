'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { trabajadoresApi, encargadosApi } from '@/lib/api';
import {
  Trabajador,
  CreateTrabajadorDto,
  TrabajadorAusencia,
  CreateAusenciaDto,
  TipoContrato,
  TipoAusencia,
  TipoCarnet,
} from '@/types';
import { Switch } from '@/components/ui/switch';
import {
  ArrowLeft,
  Save,
  Trash2,
  Palmtree,
  Stethoscope,
  HeartPulse,
  Calendar,
  Plus,
  Edit,
  AlertTriangle,
  Phone,
  Mail,
  Building2,
  HardHat,
  Copy,
  RefreshCw,
  Link2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { format, parseISO, differenceInDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
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

const tiposBaja = [TipoAusencia.BAJA_ENFERMEDAD, TipoAusencia.BAJA_ACCIDENTE];

const tipoAusenciaIcons: Record<TipoAusencia, typeof Palmtree> = {
  [TipoAusencia.VACACIONES]: Palmtree,
  [TipoAusencia.BAJA_ENFERMEDAD]: Stethoscope,
  [TipoAusencia.BAJA_ACCIDENTE]: HeartPulse,
  [TipoAusencia.PERMISO]: Calendar,
  [TipoAusencia.OTRO]: Calendar,
};

function esBajaActiva(ausencia: TrabajadorAusencia): boolean {
  return tiposBaja.includes(ausencia.tipo) && !ausencia.fechaFin;
}

export default function TrabajadorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [trabajador, setTrabajador] = useState<Trabajador | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form data
  const [formData, setFormData] = useState<CreateTrabajadorDto>({
    nombre: '',
  });

  // Ausencia dialogs
  const [ausenciaDialogOpen, setAusenciaDialogOpen] = useState(false);
  const [ausenciaMode, setAusenciaMode] = useState<'vacaciones' | 'baja'>('vacaciones');
  const [editingAusencia, setEditingAusencia] = useState<TrabajadorAusencia | null>(null);
  const [ausenciaFormData, setAusenciaFormData] = useState<CreateAusenciaDto>({
    tipo: TipoAusencia.VACACIONES,
    fechaInicio: '',
    fechaFin: '',
    notas: '',
  });

  // Alta dialog
  const [altaDialogOpen, setAltaDialogOpen] = useState(false);
  const [ausenciaParaAlta, setAusenciaParaAlta] = useState<TrabajadorAusencia | null>(null);
  const [fechaAlta, setFechaAlta] = useState('');

  // Conflict dialog
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  // Encargado
  const [showPin, setShowPin] = useState(false);
  const [regeneratingToken, setRegeneratingToken] = useState(false);

  // Baja warning dialog (for affected assignments)
  const [bajaWarningDialogOpen, setBajaWarningDialogOpen] = useState(false);
  const [asignacionesAfectadas, setAsignacionesAfectadas] = useState<
    { id: string; obraId: string; obraNombre: string; fechaInicio: string; fechaFin?: string }[]
  >([]);

  const loadTrabajador = async () => {
    try {
      const data = await trabajadoresApi.getById(id);
      setTrabajador(data);
      setFormData({
        nombre: data.nombre,
        cargo: data.cargo || '',
        descripcion: data.descripcion || '',
        telefono: data.telefono || '',
        email: data.email || '',
        tipoContrato: data.tipoContrato,
        fechaInicioContrato: data.fechaInicioContrato?.split('T')[0] || '',
        fechaFinContrato: data.fechaFinContrato?.split('T')[0] || '',
        diasVacacionesAnuales: data.diasVacacionesAnuales,
        especialidades: data.especialidades || [],
        carnetConducir: data.carnetConducir,
        carnetConducirVencimiento: data.carnetConducirVencimiento?.split('T')[0] || '',
        reconocimientoMedicoVencimiento: data.reconocimientoMedicoVencimiento?.split('T')[0] || '',
        formacionPRLVencimiento: data.formacionPRLVencimiento?.split('T')[0] || '',
        esEncargado: data.esEncargado || false,
        pin: data.pin || '',
      });
      setHasChanges(false);
    } catch (error) {
      console.error('Error loading trabajador:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrabajador();
  }, [id]);

  const handleFormChange = (updates: Partial<CreateTrabajadorDto>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = {
        ...formData,
        especialidades: formData.especialidades?.length ? formData.especialidades : undefined,
      };
      await trabajadoresApi.update(id, dataToSend);
      setHasChanges(false);
      await loadTrabajador();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este trabajador? Esta acción no se puede deshacer.')) return;
    try {
      await trabajadoresApi.delete(id);
      router.push('/trabajadores');
    } catch (error) {
      alert('Error al eliminar trabajador');
    }
  };

  const handleRegenerarToken = async () => {
    if (!confirm('¿Regenerar el enlace público? El enlace anterior dejará de funcionar.')) return;
    setRegeneratingToken(true);
    try {
      await encargadosApi.regenerarToken(id);
      await loadTrabajador();
    } catch (error) {
      alert('Error al regenerar token');
    } finally {
      setRegeneratingToken(false);
    }
  };

  const getPublicLink = () => {
    if (!trabajador?.publicToken) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/encargado/${trabajador.publicToken}`;
  };

  const copyPublicLink = () => {
    const link = getPublicLink();
    if (link) {
      navigator.clipboard.writeText(link);
    }
  };

  // Ausencia handlers
  const openNewAusenciaDialog = (mode: 'vacaciones' | 'baja') => {
    setEditingAusencia(null);
    setAusenciaMode(mode);
    setAusenciaFormData({
      tipo: mode === 'baja' ? TipoAusencia.BAJA_ENFERMEDAD : TipoAusencia.VACACIONES,
      fechaInicio: format(new Date(), 'yyyy-MM-dd'),
      fechaFin: '',
      notas: '',
    });
    setAusenciaDialogOpen(true);
  };

  const openEditAusenciaDialog = (ausencia: TrabajadorAusencia) => {
    setEditingAusencia(ausencia);
    setAusenciaMode(tiposBaja.includes(ausencia.tipo) ? 'baja' : 'vacaciones');
    setAusenciaFormData({
      tipo: ausencia.tipo,
      fechaInicio: ausencia.fechaInicio.split('T')[0],
      fechaFin: ausencia.fechaFin?.split('T')[0] || '',
      notas: ausencia.notas || '',
    });
    setAusenciaDialogOpen(true);
  };

  const handleAusenciaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const dataToSend: CreateAusenciaDto = {
        tipo: ausenciaFormData.tipo,
        fechaInicio: ausenciaFormData.fechaInicio,
        notas: ausenciaFormData.notas || undefined,
      };
      if (ausenciaFormData.fechaFin) {
        dataToSend.fechaFin = ausenciaFormData.fechaFin;
      }

      if (editingAusencia) {
        await trabajadoresApi.updateAusencia(id, editingAusencia.id, dataToSend);
      } else {
        const result = await trabajadoresApi.createAusencia(id, dataToSend);
        // Check if there are affected assignments (baja with future obra assignments)
        if (result.asignacionesAfectadas && result.asignacionesAfectadas.length > 0) {
          setAsignacionesAfectadas(result.asignacionesAfectadas);
          setBajaWarningDialogOpen(true);
        }
      }
      setAusenciaDialogOpen(false);
      await loadTrabajador();
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
      setSaving(false);
    }
  };

  const handleDeleteAusencia = async (ausenciaId: string) => {
    if (!confirm('¿Eliminar esta ausencia?')) return;
    try {
      await trabajadoresApi.deleteAusencia(id, ausenciaId);
      await loadTrabajador();
    } catch (error) {
      console.error('Error deleting ausencia:', error);
      const message = error instanceof Error ? error.message : 'Error al eliminar ausencia';
      alert(message);
    }
  };

  const openAltaDialog = (ausencia: TrabajadorAusencia) => {
    setAusenciaParaAlta(ausencia);
    setFechaAlta(format(new Date(), 'yyyy-MM-dd'));
    setAltaDialogOpen(true);
  };

  const handleDarAlta = async () => {
    if (!ausenciaParaAlta || !fechaAlta) return;
    setSaving(true);
    try {
      await trabajadoresApi.updateAusencia(id, ausenciaParaAlta.id, { fechaFin: fechaAlta });
      setAltaDialogOpen(false);
      setAusenciaParaAlta(null);
      setFechaAlta('');
      await loadTrabajador();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al dar de alta');
    } finally {
      setSaving(false);
    }
  };

  // Document alerts
  const getAlertasDocumentos = () => {
    if (!trabajador) return [];
    const alertas: { campo: string; estado: 'vencido' | 'proximo' }[] = [];
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    if (trabajador.reconocimientoMedicoVencimiento) {
      const fecha = parseISO(trabajador.reconocimientoMedicoVencimiento);
      if (isBefore(fecha, hoy)) {
        alertas.push({ campo: 'Reconocimiento médico', estado: 'vencido' });
      } else if (isBefore(fecha, en30Dias)) {
        alertas.push({ campo: 'Reconocimiento médico', estado: 'proximo' });
      }
    }

    if (trabajador.formacionPRLVencimiento) {
      const fecha = parseISO(trabajador.formacionPRLVencimiento);
      if (isBefore(fecha, hoy)) {
        alertas.push({ campo: 'Formación PRL', estado: 'vencido' });
      } else if (isBefore(fecha, en30Dias)) {
        alertas.push({ campo: 'Formación PRL', estado: 'proximo' });
      }
    }

    if (trabajador.carnetConducirVencimiento) {
      const fecha = parseISO(trabajador.carnetConducirVencimiento);
      if (isBefore(fecha, hoy)) {
        alertas.push({ campo: 'Carnet de conducir', estado: 'vencido' });
      } else if (isBefore(fecha, en30Dias)) {
        alertas.push({ campo: 'Carnet de conducir', estado: 'proximo' });
      }
    }

    if (trabajador.fechaFinContrato) {
      const fecha = parseISO(trabajador.fechaFinContrato);
      if (isBefore(fecha, hoy)) {
        alertas.push({ campo: 'Contrato', estado: 'vencido' });
      } else if (isBefore(fecha, en30Dias)) {
        alertas.push({ campo: 'Contrato', estado: 'proximo' });
      }
    }

    return alertas;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!trabajador) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Trabajador no encontrado</p>
        <Button asChild variant="outline">
          <Link href="/trabajadores">Volver al equipo</Link>
        </Button>
      </div>
    );
  }

  const alertas = getAlertasDocumentos();
  const bajaActiva = trabajador.ausencias?.find((a) => esBajaActiva(a));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/trabajadores">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{trabajador.nombre}</h1>
            {trabajador.cargo && (
              <p className="text-sm text-muted-foreground">{trabajador.cargo}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              Sin guardar
            </Badge>
          )}
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alertas.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {alertas.map((a, i) => (
                  <p key={i} className={cn(
                    "text-sm",
                    a.estado === 'vencido' ? 'text-red-600 font-medium' : 'text-amber-700 dark:text-amber-300'
                  )}>
                    {a.campo} {a.estado === 'vencido' ? 'vencido' : 'próximo a vencer'}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active baja alert */}
      {bajaActiva && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300">
                    {tipoAusenciaLabels[bajaActiva.tipo]}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Desde {format(parseISO(bajaActiva.fechaInicio), "d 'de' MMMM yyyy", { locale: es })}
                    {' '}({differenceInDays(new Date(), parseISO(bajaActiva.fechaInicio)) + 1} días)
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300"
                onClick={() => openAltaDialog(bajaActiva)}
              >
                Dar de alta
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick contact */}
      <div className="flex flex-wrap gap-3">
        {trabajador.telefono && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${trabajador.telefono}`}>
              <Phone className="h-4 w-4 mr-2" />
              {trabajador.telefono}
            </a>
          </Button>
        )}
        {trabajador.email && (
          <Button variant="outline" size="sm" asChild>
            <a href={`mailto:${trabajador.email}`}>
              <Mail className="h-4 w-4 mr-2" />
              {trabajador.email}
            </a>
          </Button>
        )}
      </div>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="ausencias">
            Ausencias
            {trabajador.ausencias && trabajador.ausencias.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {trabajador.ausencias.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="obras">Obras</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="perfil" className="mt-4 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Información básica</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleFormChange({ nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Input
                  id="cargo"
                  value={formData.cargo}
                  onChange={(e) => handleFormChange({ cargo: e.target.value })}
                  placeholder="Ej: Albañil, Electricista"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => handleFormChange({ telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange({ email: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="especialidades">Especialidades</Label>
                <Input
                  id="especialidades"
                  value={formData.especialidades?.join(', ') || ''}
                  onChange={(e) =>
                    handleFormChange({
                      especialidades: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="Albañilería, Fontanería, etc."
                />
                <p className="text-xs text-muted-foreground">Separadas por comas</p>
              </div>
            </CardContent>
          </Card>

          {/* Contract */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contrato</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Tipo de contrato</Label>
                <Select
                  value={formData.tipoContrato || ''}
                  onValueChange={(v) => handleFormChange({ tipoContrato: v as TipoContrato })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(tipoContratoLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaInicioContrato">Inicio contrato</Label>
                <Input
                  id="fechaInicioContrato"
                  type="date"
                  value={formData.fechaInicioContrato || ''}
                  onChange={(e) => handleFormChange({ fechaInicioContrato: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinContrato">Fin contrato</Label>
                <Input
                  id="fechaFinContrato"
                  type="date"
                  value={formData.fechaFinContrato || ''}
                  onChange={(e) => handleFormChange({ fechaFinContrato: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasVacaciones">Días vacaciones/año</Label>
                <Input
                  id="diasVacaciones"
                  type="number"
                  min={0}
                  max={365}
                  value={formData.diasVacacionesAnuales ?? 22}
                  onChange={(e) =>
                    handleFormChange({ diasVacacionesAnuales: parseInt(e.target.value) || 22 })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentación</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Carnet de conducir</Label>
                <Select
                  value={formData.carnetConducir || ''}
                  onValueChange={(v) => handleFormChange({ carnetConducir: v as TipoCarnet })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(TipoCarnet).map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="carnetVenc">Vencimiento carnet</Label>
                <Input
                  id="carnetVenc"
                  type="date"
                  value={formData.carnetConducirVencimiento || ''}
                  onChange={(e) => handleFormChange({ carnetConducirVencimiento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicoVenc">Venc. reconocimiento médico</Label>
                <Input
                  id="medicoVenc"
                  type="date"
                  value={formData.reconocimientoMedicoVencimiento || ''}
                  onChange={(e) =>
                    handleFormChange({ reconocimientoMedicoVencimiento: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prlVenc">Venc. formación PRL</Label>
                <Input
                  id="prlVenc"
                  type="date"
                  value={formData.formacionPRLVencimiento || ''}
                  onChange={(e) => handleFormChange({ formacionPRLVencimiento: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Encargado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HardHat className="h-4 w-4" />
                Encargado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="esEncargado">Es encargado</Label>
                  <p className="text-xs text-muted-foreground">
                    Los encargados pueden ver y gestionar tareas desde un enlace público
                  </p>
                </div>
                <Switch
                  id="esEncargado"
                  checked={formData.esEncargado || false}
                  onCheckedChange={(checked) => handleFormChange({ esEncargado: checked })}
                />
              </div>

              {formData.esEncargado && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pin">PIN de acceso</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="pin"
                          type={showPin ? 'text' : 'password'}
                          value={formData.pin || ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                            handleFormChange({ pin: val });
                          }}
                          placeholder="4 dígitos"
                          maxLength={4}
                          inputMode="numeric"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setShowPin(!showPin)}
                        >
                          {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      El encargado usará este PIN para acceder a su panel
                    </p>
                  </div>

                  {trabajador?.publicToken && (
                    <div className="space-y-2">
                      <Label>Enlace público</Label>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={getPublicLink()}
                          className="text-xs font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copyPublicLink}
                          title="Copiar enlace"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleRegenerarToken}
                          disabled={regeneratingToken}
                          title="Regenerar enlace"
                        >
                          <RefreshCw className={cn("h-4 w-4", regeneratingToken && "animate-spin")} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Comparte este enlace con el encargado para que acceda a sus tareas
                      </p>
                    </div>
                  )}

                  {!trabajador?.publicToken && formData.esEncargado && (
                    <p className="text-xs text-amber-600">
                      Guarda los cambios para generar el enlace público
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Delete */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Zona peligrosa</CardTitle>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar trabajador
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ausencias Tab */}
        <TabsContent value="ausencias" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => openNewAusenciaDialog('vacaciones')}>
              <Palmtree className="h-4 w-4 mr-2" />
              Añadir ausencia
            </Button>
            {!bajaActiva && (
              <Button size="sm" variant="outline" onClick={() => openNewAusenciaDialog('baja')}>
                <Stethoscope className="h-4 w-4 mr-2" />
                Dar de baja
              </Button>
            )}
          </div>

          {!trabajador.ausencias || trabajador.ausencias.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay ausencias registradas
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Desde</TableHead>
                    <TableHead>Hasta</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Notas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trabajador.ausencias
                    .sort(
                      (a, b) =>
                        new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
                    )
                    .map((ausencia) => {
                      const Icon = tipoAusenciaIcons[ausencia.tipo];
                      const isBaja = tiposBaja.includes(ausencia.tipo);
                      const isActiva = esBajaActiva(ausencia);
                      const dias = ausencia.fechaFin
                        ? differenceInDays(parseISO(ausencia.fechaFin), parseISO(ausencia.fechaInicio)) + 1
                        : differenceInDays(new Date(), parseISO(ausencia.fechaInicio)) + 1;

                      return (
                        <TableRow key={ausencia.id} className={cn(isActiva && 'bg-red-50 dark:bg-red-950')}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Icon
                                className={cn(
                                  'h-4 w-4',
                                  ausencia.tipo === TipoAusencia.VACACIONES && 'text-green-600',
                                  isBaja && 'text-red-600',
                                  ausencia.tipo === TipoAusencia.PERMISO && 'text-blue-600'
                                )}
                              />
                              <span>{tipoAusenciaLabels[ausencia.tipo]}</span>
                              {isActiva && (
                                <Badge variant="destructive" className="text-xs">
                                  Activa
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(parseISO(ausencia.fechaInicio), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            {ausencia.fechaFin
                              ? format(parseISO(ausencia.fechaFin), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>{dias}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {ausencia.notas || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {isActiva && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openAltaDialog(ausencia)}
                                >
                                  Dar alta
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditAusenciaDialog(ausencia)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive"
                                onClick={() => handleDeleteAusencia(ausencia.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Obras Tab */}
        <TabsContent value="obras" className="mt-4">
          {!trabajador.obrasTrabajador || trabajador.obrasTrabajador.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay asignaciones a obras
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {trabajador.obrasTrabajador.map((ot) => (
                <Card key={ot.id}>
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{ot.obra?.nombre || 'Obra'}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(ot.fechaInicio), 'dd/MM/yyyy')}
                            {ot.fechaFin && ` - ${format(parseISO(ot.fechaFin), 'dd/MM/yyyy')}`}
                          </p>
                        </div>
                      </div>
                      {ot.obra && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/obras/${ot.obra.id}`}>Ver obra</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Ausencia Dialog */}
      <Dialog open={ausenciaDialogOpen} onOpenChange={setAusenciaDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {editingAusencia ? 'Editar ausencia' : ausenciaMode === 'baja' ? 'Dar de baja' : 'Nueva ausencia'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAusenciaSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={ausenciaFormData.tipo}
                onValueChange={(v) =>
                  setAusenciaFormData({ ...ausenciaFormData, tipo: v as TipoAusencia })
                }
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

            {ausenciaMode === 'baja' && !editingAusencia ? (
              <div className="space-y-2">
                <Label htmlFor="fechaInicioBaja">Fecha de baja *</Label>
                <Input
                  id="fechaInicioBaja"
                  type="date"
                  value={ausenciaFormData.fechaInicio}
                  onChange={(e) =>
                    setAusenciaFormData({ ...ausenciaFormData, fechaInicio: e.target.value })
                  }
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
                    onChange={(e) =>
                      setAusenciaFormData({ ...ausenciaFormData, fechaInicio: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechaFinAus">Hasta</Label>
                  <Input
                    id="fechaFinAus"
                    type="date"
                    value={ausenciaFormData.fechaFin || ''}
                    onChange={(e) =>
                      setAusenciaFormData({ ...ausenciaFormData, fechaFin: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notasAus">Notas</Label>
              <Textarea
                id="notasAus"
                value={ausenciaFormData.notas || ''}
                onChange={(e) =>
                  setAusenciaFormData({ ...ausenciaFormData, notas: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAusenciaDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando...' : editingAusencia ? 'Guardar' : ausenciaMode === 'baja' ? 'Dar de baja' : 'Añadir'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alta Dialog */}
      <Dialog open={altaDialogOpen} onOpenChange={setAltaDialogOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>Dar de alta</DialogTitle>
          </DialogHeader>
          {ausenciaParaAlta && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p>
                  <strong>Tipo:</strong> {tipoAusenciaLabels[ausenciaParaAlta.tipo]}
                </p>
                <p>
                  <strong>Fecha baja:</strong>{' '}
                  {format(parseISO(ausenciaParaAlta.fechaInicio), "d 'de' MMMM yyyy", { locale: es })}
                </p>
                <p>
                  <strong>Días transcurridos:</strong>{' '}
                  {differenceInDays(new Date(), parseISO(ausenciaParaAlta.fechaInicio)) + 1} días
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaAlta">Fecha de alta *</Label>
                <Input
                  id="fechaAlta"
                  type="date"
                  value={fechaAlta}
                  onChange={(e) => setFechaAlta(e.target.value)}
                  min={ausenciaParaAlta.fechaInicio.split('T')[0]}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAltaDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleDarAlta} disabled={saving || !fechaAlta}>
                  {saving ? 'Guardando...' : 'Confirmar alta'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Conflict Dialog */}
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
                <li>Ir a la pestaña <strong>Obras</strong> de este trabajador</li>
                <li>Revisar las asignaciones que coinciden con las fechas</li>
                <li>Desasignar al trabajador de esas obras o modificar las fechas de asignación</li>
              </ol>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConflictDialogOpen(false)}>
                Entendido
              </Button>
              <Button
                onClick={() => {
                  setConflictDialogOpen(false);
                  // Switch to obras tab
                  const obrasTab = document.querySelector('[data-state="inactive"][value="obras"]') as HTMLElement;
                  if (obrasTab) obrasTab.click();
                }}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Ver obras asignadas
              </Button>
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
              <p>Puedes ver todas las asignaciones pendientes en la sección de <strong>Alertas</strong> del dashboard.</p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setBajaWarningDialogOpen(false)}>
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
