'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KanbanBoard } from '@/components/tareas/KanbanBoard';
import { ObraForm } from '@/components/obras/ObraForm';
import { AsignarTrabajadorModal } from '@/components/obras/AsignarTrabajadorModal';
import { ArchivosTab } from '@/components/archivos/ArchivosTab';
import { FotosTab } from '@/components/archivos/FotosTab';
import { obrasApi } from '@/lib/api';
import { Obra, EstadoObra, ObraTrabajador } from '@/types';
import {
  ArrowLeft,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  Trash2,
  Phone,
  Mail,
  AlertCircle,
  Image,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const estadoConfig: Record<
  EstadoObra,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [EstadoObra.SIN_INICIAR]: { label: 'Sin iniciar', variant: 'secondary' },
  [EstadoObra.EN_PROGRESO]: { label: 'En progreso', variant: 'default' },
  [EstadoObra.LISTA_PARA_CERRAR]: { label: 'Lista para cerrar', variant: 'outline' },
  [EstadoObra.COMPLETADA]: { label: 'Completada', variant: 'secondary' },
};

export default function ObraDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [obra, setObra] = useState<Obra | null>(null);
  const [trabajadores, setTrabajadores] = useState<ObraTrabajador[]>([]);
  const [loading, setLoading] = useState(true);

  const obraId = params.id as string;

  const loadObra = async () => {
    try {
      const [obraData, trabajadoresData] = await Promise.all([
        obrasApi.getById(obraId),
        obrasApi.getTrabajadores(obraId),
      ]);
      setObra(obraData);
      setTrabajadores(trabajadoresData);
    } catch (error) {
      console.error('Error loading obra:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObra();
  }, [obraId]);

  const handleCerrar = async () => {
    if (!confirm('¿Cerrar esta obra? Esta accion no se puede deshacer.')) return;
    try {
      await obrasApi.cerrar(obraId);
      loadObra();
    } catch (error) {
      alert('Error al cerrar la obra');
    }
  };

  const handleEliminar = async () => {
    if (!confirm('¿Eliminar esta obra? Se eliminaran todas las tareas asociadas.'))
      return;
    try {
      await obrasApi.delete(obraId);
      router.push('/obras');
    } catch (error) {
      alert('Error al eliminar la obra');
    }
  };

  const handleDesasignar = async (asignacionId: string) => {
    if (!confirm('¿Desasignar este trabajador?')) return;
    try {
      await obrasApi.desasignarTrabajador(obraId, asignacionId);
      loadObra();
    } catch (error) {
      alert('Error al desasignar trabajador');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!obra) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Obra no encontrada</p>
        <Link href="/obras" className="text-primary hover:underline">
          Volver a obras
        </Link>
      </div>
    );
  }

  const config = estadoConfig[obra.estado];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href="/obras">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{obra.nombre}</h1>
              <Badge variant={config.variant}>{config.label}</Badge>
            </div>
            {obra.descripcion && (
              <p className="text-muted-foreground mt-1">{obra.descripcion}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 ml-10 md:ml-0">
          <ObraForm obra={obra} onSuccess={loadObra} />
          {obra.estado === EstadoObra.LISTA_PARA_CERRAR && (
            <Button onClick={handleCerrar} variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Cerrar Obra
            </Button>
          )}
          <Button onClick={handleEliminar} variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Previstas</span>
            </div>
            <p className="text-xs md:text-sm">
              {obra.fechaInicioPrev ? (
                <>
                  {format(new Date(obra.fechaInicioPrev), 'dd MMM', { locale: es })}
                  {obra.fechaFinPrev && (
                    <> - {format(new Date(obra.fechaFinPrev), 'dd MMM', { locale: es })}</>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Sin definir</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Reales</span>
            </div>
            <p className="text-xs md:text-sm">
              {obra.fechaInicioReal ? (
                <>
                  {format(new Date(obra.fechaInicioReal), 'dd MMM', { locale: es })}
                  {obra.fechaFinReal && (
                    <> - {format(new Date(obra.fechaFinReal), 'dd MMM', { locale: es })}</>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">No iniciada</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">Equipo</span>
            </div>
            <p className="text-xs md:text-sm">{trabajadores.length} asignados</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tareas">
        <TabsList>
          <TabsTrigger value="tareas">Tareas</TabsTrigger>
          <TabsTrigger value="equipo">Equipo</TabsTrigger>
          <TabsTrigger value="archivos">Archivos</TabsTrigger>
          <TabsTrigger value="fotos">Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="tareas" className="mt-4">
          <KanbanBoard
            obraId={obraId}
            tareas={obra.tareas || []}
            trabajadoresAsignados={trabajadores}
            onUpdate={loadObra}
          />
        </TabsContent>

        <TabsContent value="equipo" className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Trabajadores Asignados</h2>
            <AsignarTrabajadorModal obraId={obraId} onSuccess={loadObra} />
          </div>
          {trabajadores.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No hay trabajadores asignados
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {trabajadores.map((asignacion) => (
                <Card
                  key={asignacion.id}
                  className={asignacion.pendienteConfirmacion ? 'border-amber-300 dark:border-amber-700' : ''}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {asignacion.trabajador?.nombre}
                          </p>
                          {asignacion.pendienteConfirmacion && (
                            <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Pendiente confirmar
                            </Badge>
                          )}
                        </div>
                        {asignacion.trabajador?.cargo && (
                          <p className="text-sm text-muted-foreground">
                            {asignacion.trabajador.cargo}
                          </p>
                        )}
                        <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                          {asignacion.trabajador?.telefono && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {asignacion.trabajador.telefono}
                            </span>
                          )}
                          {asignacion.trabajador?.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {asignacion.trabajador.email}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(asignacion.fechaInicio), 'dd MMM', {
                            locale: es,
                          })}
                          {asignacion.fechaFin &&
                            ` - ${format(new Date(asignacion.fechaFin), 'dd MMM', {
                              locale: es,
                            })}`}
                        </p>
                        {asignacion.notas && (
                          <p className="text-xs mt-1">{asignacion.notas}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDesasignar(asignacion.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archivos" className="mt-4">
          <ArchivosTab obraId={obraId} />
        </TabsContent>

        <TabsContent value="fotos" className="mt-4">
          <FotosTab obraId={obraId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
