'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
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
        <>
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tabs.map((tab) => (
              <SelectItem
                key={tab.id}
                value={tab.id}
                disabled={tab.id !== 'all' && tab.count === 0}
              >
                <span className="flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                      {tab.count}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="space-y-6">
          {(activeTab === 'all' || activeTab === 'bajas') && counts.trabajadoresBaja > 0 && (
            <Section title="Personal de baja" icon={UserX} count={counts.trabajadoresBaja}>
              {data.trabajadoresBaja.map((t) => (
                <TrabajadorBajaCard key={t.id} trabajador={t} />
              ))}
            </Section>
          )}

          {(activeTab === 'all' || activeTab === 'sin-personal') && counts.obrasSinPersonal > 0 && (
            <Section title="Obras sin personal" icon={Building2} count={counts.obrasSinPersonal}>
              {data.obrasSinPersonal.map((o) => (
                <ObraSinPersonalCard key={o.id} obra={o} />
              ))}
            </Section>
          )}

          {(activeTab === 'all' || activeTab === 'cerrar') && counts.obrasListasCerrar > 0 && (
            <Section title="Listas para cerrar" icon={CheckCircle} count={counts.obrasListasCerrar}>
              {data.obrasListasCerrar.map((o) => (
                <ObraListaCerrarCard key={o.id} obra={o} onCerrar={handleCerrarObra} />
              ))}
            </Section>
          )}

          {(activeTab === 'all' || activeTab === 'confirmacion') && counts.asignacionesPendientes > 0 && (
            <Section title="Asignaciones pendientes" icon={Clock} count={counts.asignacionesPendientes}>
              {data.asignacionesPendientes.map((a) => (
                <AsignacionPendienteCard key={a.id} asignacion={a} />
              ))}
            </Section>
          )}

          {(activeTab === 'all' || activeTab === 'tareas-vencidas') && counts.tareasVencidas > 0 && (
            <Section title="Tareas vencidas" icon={Calendar} count={counts.tareasVencidas}>
              {data.tareasVencidas.map((t) => (
                <TareaVencidaCard key={t.id} tarea={t} />
              ))}
            </Section>
          )}

          {(activeTab === 'all' || activeTab === 'obras-vencidas') && counts.obrasVencidas > 0 && (
            <Section title="Obras con fecha vencida" icon={AlertTriangle} count={counts.obrasVencidas}>
              {data.obrasVencidas.map((o) => (
                <ObraVencidaCard key={o.id} obra={o} />
              ))}
            </Section>
          )}

          {(activeTab === 'all' || activeTab === 'mensajes') && counts.comentariosSinLeer > 0 && (
            <Section title="Mensajes de encargados" icon={MessageSquare} count={counts.comentariosSinLeer}>
              {data.comentariosSinLeer.map((c) => (
                <ComentarioSinLeerCard key={c.id} comentario={c} />
              ))}
            </Section>
          )}
        </div>
        </>
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
    <Link href={`/trabajadores/${trabajador.id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <UserX className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{trabajador.nombre}</p>
              <p className="text-sm text-muted-foreground">{trabajador.cargo || 'Sin cargo'}</p>
            </div>
            <Badge variant="outline" className="text-xs shrink-0">
              {tipoAusenciaLabels[trabajador.tipoAusencia] || trabajador.tipoAusencia}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground pl-12">
            <span>
              Desde {format(new Date(trabajador.fechaInicio), 'dd MMM', { locale: es })}
            </span>
            {trabajador.fechaFin ? (
              <span>
                · Hasta {format(new Date(trabajador.fechaFin), 'dd MMM', { locale: es })}
              </span>
            ) : (
              <span className="text-orange-600 dark:text-orange-400">· Sin fecha fin</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ObraSinPersonalCard({ obra }: { obra: RevisionResponse['obrasSinPersonal'][0] }) {
  return (
    <Link href={`/obras/${obra.id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{obra.nombre}</p>
              <p className="text-sm text-muted-foreground">Sin trabajadores asignados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
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
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{obra.nombre}</p>
            <p className="text-sm text-muted-foreground">
              {obra.tareasCompletadas} tarea{obra.tareasCompletadas !== 1 ? 's' : ''} completada{obra.tareasCompletadas !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2 pl-12">
          <Link href={`/obras/${obra.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Ver obra
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
    <Link href={`/obras/${asignacion.obraId}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{asignacion.trabajadorNombre}</p>
              <p className="text-sm text-muted-foreground">
                en {asignacion.obraNombre} · {format(new Date(asignacion.fechaInicio), 'dd MMM', { locale: es })}
                {asignacion.fechaFin && (
                  <> - {format(new Date(asignacion.fechaFin), 'dd MMM', { locale: es })}</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function TareaVencidaCard({ tarea }: { tarea: RevisionResponse['tareasVencidas'][0] }) {
  const diasVencida = Math.ceil(
    (new Date().getTime() - new Date(tarea.fechaLimite).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link href={`/obras/${tarea.obraId}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{tarea.titulo}</p>
              <p className="text-sm text-muted-foreground">en {tarea.obraNombre}</p>
            </div>
            <Badge variant="destructive" className="text-xs shrink-0">
              {diasVencida}d
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ObraVencidaCard({ obra }: { obra: RevisionResponse['obrasVencidas'][0] }) {
  return (
    <Link href={`/obras/${obra.id}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{obra.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Fin previsto: {format(new Date(obra.fechaFinPrev), 'dd MMM yyyy', { locale: es })}
              </p>
            </div>
            <Badge variant="destructive" className="text-xs shrink-0">
              {obra.diasVencida}d
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function ComentarioSinLeerCard({ comentario }: { comentario: RevisionResponse['comentariosSinLeer'][0] }) {
  return (
    <Link href={`/obras/${comentario.obraId}`}>
      <Card className="hover:bg-muted/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
              <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm">{comentario.autorNombre}</p>
                <span className="text-xs text-muted-foreground shrink-0">
                  {format(new Date(comentario.createdAt), 'd MMM HH:mm', { locale: es })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground truncate">{comentario.texto}</p>
              <p className="text-xs text-muted-foreground">
                {comentario.tareaTitulo} · {comentario.obraNombre}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
