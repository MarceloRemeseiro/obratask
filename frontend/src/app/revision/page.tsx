'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  UserX,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
  User,
  MessageSquare,
} from 'lucide-react';
import { revisionApi, obrasApi } from '@/lib/api';
import type { RevisionResponse, TipoAusencia } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const tipoAusenciaLabels: Record<string, string> = {
  VACACIONES: 'Vacaciones',
  BAJA_ENFERMEDAD: 'Baja por enfermedad',
  BAJA_ACCIDENTE: 'Baja por accidente',
  PERMISO: 'Permiso',
  OTRO: 'Otro',
};

export default function RevisionPage() {
  const [data, setData] = useState<RevisionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const fetchData = async () => {
    try {
      const response = await revisionApi.getAll();
      setData(response);
    } catch (error) {
      console.error('Error fetching revision data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCerrarObra = async (obraId: string) => {
    if (!confirm('¿Cerrar esta obra?')) return;
    try {
      await obrasApi.cerrar(obraId);
      fetchData();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Revisión</h1>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Revisión</h1>
        <p className="text-muted-foreground">Error al cargar datos</p>
      </div>
    );
  }

  const { counts } = data;

  const tabs = [
    { id: 'all', label: 'Todo', count: counts.total, icon: AlertTriangle },
    { id: 'bajas', label: 'Personal de baja', count: counts.trabajadoresBaja, icon: UserX },
    { id: 'sin-personal', label: 'Sin personal', count: counts.obrasSinPersonal, icon: Building2 },
    { id: 'cerrar', label: 'Listas para cerrar', count: counts.obrasListasCerrar, icon: CheckCircle },
    { id: 'confirmacion', label: 'Pendientes', count: counts.asignacionesPendientes, icon: Clock },
    { id: 'tareas-vencidas', label: 'Tareas vencidas', count: counts.tareasVencidas, icon: Calendar },
    { id: 'obras-vencidas', label: 'Obras vencidas', count: counts.obrasVencidas, icon: AlertTriangle },
    { id: 'mensajes', label: 'Mensajes', count: counts.comentariosSinLeer, icon: MessageSquare },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Revisión</h1>
        {counts.total > 0 && (
          <Badge variant="destructive" className="text-sm">
            {counts.total} pendiente{counts.total !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {counts.total === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Todo al día</p>
            <p className="text-muted-foreground">No hay items pendientes de revisión</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex items-center gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                disabled={tab.id !== 'all' && tab.count === 0}
              >
                <tab.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.count > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                    {tab.count}
                  </Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All items */}
          <TabsContent value="all" className="space-y-6">
            {counts.trabajadoresBaja > 0 && (
              <Section
                title="Personal de baja"
                icon={UserX}
                count={counts.trabajadoresBaja}
              >
                {data.trabajadoresBaja.map((t) => (
                  <TrabajadorBajaCard key={t.id} trabajador={t} />
                ))}
              </Section>
            )}

            {counts.obrasSinPersonal > 0 && (
              <Section
                title="Obras sin personal"
                icon={Building2}
                count={counts.obrasSinPersonal}
              >
                {data.obrasSinPersonal.map((o) => (
                  <ObraSinPersonalCard key={o.id} obra={o} />
                ))}
              </Section>
            )}

            {counts.obrasListasCerrar > 0 && (
              <Section
                title="Listas para cerrar"
                icon={CheckCircle}
                count={counts.obrasListasCerrar}
              >
                {data.obrasListasCerrar.map((o) => (
                  <ObraListaCerrarCard key={o.id} obra={o} onCerrar={handleCerrarObra} />
                ))}
              </Section>
            )}

            {counts.asignacionesPendientes > 0 && (
              <Section
                title="Asignaciones pendientes de confirmación"
                icon={Clock}
                count={counts.asignacionesPendientes}
              >
                {data.asignacionesPendientes.map((a) => (
                  <AsignacionPendienteCard key={a.id} asignacion={a} />
                ))}
              </Section>
            )}

            {counts.tareasVencidas > 0 && (
              <Section
                title="Tareas vencidas"
                icon={Calendar}
                count={counts.tareasVencidas}
              >
                {data.tareasVencidas.map((t) => (
                  <TareaVencidaCard key={t.id} tarea={t} />
                ))}
              </Section>
            )}

            {counts.obrasVencidas > 0 && (
              <Section
                title="Obras con fecha vencida"
                icon={AlertTriangle}
                count={counts.obrasVencidas}
              >
                {data.obrasVencidas.map((o) => (
                  <ObraVencidaCard key={o.id} obra={o} />
                ))}
              </Section>
            )}

            {counts.comentariosSinLeer > 0 && (
              <Section
                title="Mensajes de encargados"
                icon={MessageSquare}
                count={counts.comentariosSinLeer}
              >
                {data.comentariosSinLeer.map((c) => (
                  <ComentarioSinLeerCard key={c.id} comentario={c} />
                ))}
              </Section>
            )}
          </TabsContent>

          {/* Individual tabs */}
          <TabsContent value="bajas" className="space-y-2">
            {data.trabajadoresBaja.map((t) => (
              <TrabajadorBajaCard key={t.id} trabajador={t} />
            ))}
          </TabsContent>

          <TabsContent value="sin-personal" className="space-y-2">
            {data.obrasSinPersonal.map((o) => (
              <ObraSinPersonalCard key={o.id} obra={o} />
            ))}
          </TabsContent>

          <TabsContent value="cerrar" className="space-y-2">
            {data.obrasListasCerrar.map((o) => (
              <ObraListaCerrarCard key={o.id} obra={o} onCerrar={handleCerrarObra} />
            ))}
          </TabsContent>

          <TabsContent value="confirmacion" className="space-y-2">
            {data.asignacionesPendientes.map((a) => (
              <AsignacionPendienteCard key={a.id} asignacion={a} />
            ))}
          </TabsContent>

          <TabsContent value="tareas-vencidas" className="space-y-2">
            {data.tareasVencidas.map((t) => (
              <TareaVencidaCard key={t.id} tarea={t} />
            ))}
          </TabsContent>

          <TabsContent value="obras-vencidas" className="space-y-2">
            {data.obrasVencidas.map((o) => (
              <ObraVencidaCard key={o.id} obra={o} />
            ))}
          </TabsContent>

          <TabsContent value="mensajes" className="space-y-2">
            {data.comentariosSinLeer.map((c) => (
              <ComentarioSinLeerCard key={c.id} comentario={c} />
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: typeof AlertTriangle;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">{title}</h2>
        <Badge variant="outline">{count}</Badge>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function TrabajadorBajaCard({ trabajador }: { trabajador: RevisionResponse['trabajadoresBaja'][0] }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <UserX className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{trabajador.nombre}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{trabajador.cargo || 'Sin cargo'}</span>
              <span>·</span>
              <Badge variant="outline" className="text-xs">
                {tipoAusenciaLabels[trabajador.tipoAusencia] || trabajador.tipoAusencia}
              </Badge>
            </div>
          </div>
        </div>
        <div className="text-right text-sm shrink-0">
          <p className="text-muted-foreground">
            Desde {format(new Date(trabajador.fechaInicio), 'dd MMM', { locale: es })}
          </p>
          {trabajador.fechaFin ? (
            <p className="text-muted-foreground">
              Hasta {format(new Date(trabajador.fechaFin), 'dd MMM', { locale: es })}
            </p>
          ) : (
            <p className="text-orange-600 dark:text-orange-400">Sin fecha fin</p>
          )}
        </div>
        <Link href={`/trabajadores/${trabajador.id}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ObraSinPersonalCard({ obra }: { obra: RevisionResponse['obrasSinPersonal'][0] }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{obra.nombre}</p>
            <p className="text-sm text-muted-foreground">
              Sin trabajadores asignados
            </p>
          </div>
        </div>
        <Link href={`/obras/${obra.id}`}>
          <Button variant="outline" size="sm">
            Asignar personal
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ObraListaCerrarCard({
  obra,
  onCerrar,
}: {
  obra: RevisionResponse['obrasListasCerrar'][0];
  onCerrar: (id: string) => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{obra.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {obra.tareasCompletadas} tarea{obra.tareasCompletadas !== 1 ? 's' : ''} completada{obra.tareasCompletadas !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/obras/${obra.id}`}>
            <Button variant="ghost" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button size="sm" onClick={() => onCerrar(obra.id)}>
            Cerrar obra
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AsignacionPendienteCard({
  asignacion,
}: {
  asignacion: RevisionResponse['asignacionesPendientes'][0];
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{asignacion.trabajadorNombre}</p>
            <p className="text-sm text-muted-foreground truncate">
              en {asignacion.obraNombre}
            </p>
          </div>
        </div>
        <div className="text-right text-sm shrink-0">
          <p className="text-muted-foreground">
            {format(new Date(asignacion.fechaInicio), 'dd MMM', { locale: es })}
            {asignacion.fechaFin && (
              <> - {format(new Date(asignacion.fechaFin), 'dd MMM', { locale: es })}</>
            )}
          </p>
        </div>
        <Link href={`/obras/${asignacion.obraId}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function TareaVencidaCard({ tarea }: { tarea: RevisionResponse['tareasVencidas'][0] }) {
  const diasVencida = Math.ceil(
    (new Date().getTime() - new Date(tarea.fechaLimite).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{tarea.titulo}</p>
            <p className="text-sm text-muted-foreground truncate">
              en {tarea.obraNombre}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <Badge variant="destructive" className="text-xs">
            {diasVencida} día{diasVencida !== 1 ? 's' : ''} vencida
          </Badge>
        </div>
        <Link href={`/obras/${tarea.obraId}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ObraVencidaCard({ obra }: { obra: RevisionResponse['obrasVencidas'][0] }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{obra.nombre}</p>
            <p className="text-sm text-muted-foreground">
              Fecha fin prevista: {format(new Date(obra.fechaFinPrev), 'dd MMM yyyy', { locale: es })}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <Badge variant="destructive" className="text-xs">
            {obra.diasVencida} día{obra.diasVencida !== 1 ? 's' : ''} de retraso
          </Badge>
        </div>
        <Link href={`/obras/${obra.id}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function ComentarioSinLeerCard({ comentario }: { comentario: RevisionResponse['comentariosSinLeer'][0] }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{comentario.autorNombre}</p>
            <p className="text-sm text-muted-foreground truncate">{comentario.texto}</p>
            <p className="text-xs text-muted-foreground">
              {comentario.tareaTitulo} · {comentario.obraNombre}
            </p>
          </div>
        </div>
        <div className="text-right text-xs text-muted-foreground shrink-0">
          {format(new Date(comentario.createdAt), 'd MMM HH:mm', { locale: es })}
        </div>
        <Link href={`/obras/${comentario.obraId}`}>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
