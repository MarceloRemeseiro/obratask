'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trabajadoresApi, obrasApi } from '@/lib/api';
import { Trabajador, Obra, ObraTrabajador, TrabajadorAusencia, TipoAusencia } from '@/types';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  Palmtree,
  Stethoscope,
  HeartPulse,
  AlertCircle,
} from 'lucide-react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isWithinInterval,
  parseISO,
  isSameDay,
  startOfDay,
  isToday,
} from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const tipoAusenciaLabels: Record<TipoAusencia, string> = {
  [TipoAusencia.VACACIONES]: 'Vacaciones',
  [TipoAusencia.BAJA_ENFERMEDAD]: 'Baja enfermedad',
  [TipoAusencia.BAJA_ACCIDENTE]: 'Baja accidente',
  [TipoAusencia.PERMISO]: 'Permiso',
  [TipoAusencia.OTRO]: 'Otro',
};

const tipoAusenciaColors: Record<TipoAusencia, string> = {
  [TipoAusencia.VACACIONES]: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
  [TipoAusencia.BAJA_ENFERMEDAD]: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  [TipoAusencia.BAJA_ACCIDENTE]: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
  [TipoAusencia.PERMISO]: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  [TipoAusencia.OTRO]: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200',
};

const tipoAusenciaIcons: Record<TipoAusencia, typeof Palmtree> = {
  [TipoAusencia.VACACIONES]: Palmtree,
  [TipoAusencia.BAJA_ENFERMEDAD]: Stethoscope,
  [TipoAusencia.BAJA_ACCIDENTE]: HeartPulse,
  [TipoAusencia.PERMISO]: Calendar,
  [TipoAusencia.OTRO]: Calendar,
};

interface TrabajadorConAsignaciones extends Trabajador {
  asignaciones: (ObraTrabajador & { obra: Obra })[];
}

export default function PlanificacionPage() {
  const [trabajadores, setTrabajadores] = useState<TrabajadorConAsignaciones[]>(
    []
  );
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedTrabajador, setSelectedTrabajador] =
    useState<TrabajadorConAsignaciones | null>(null);
  const [vista, setVista] = useState<'resumen' | 'semana'>('resumen');

  useEffect(() => {
    Promise.all([trabajadoresApi.getAll(), obrasApi.getAll()])
      .then(([trabajadoresData, obrasData]) => {
        // Enriquecer trabajadores con sus asignaciones
        const trabajadoresConAsignaciones = trabajadoresData.map((t) => {
          const asignaciones: (ObraTrabajador & { obra: Obra })[] = [];
          obrasData.forEach((obra) => {
            obra.obrasTrabajador?.forEach((ot) => {
              if (ot.trabajadorId === t.id) {
                asignaciones.push({ ...ot, obra });
              }
            });
          });
          return { ...t, asignaciones };
        });
        setTrabajadores(trabajadoresConAsignaciones);
        setObras(obrasData);
      })
      .finally(() => setLoading(false));
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const end = endOfWeek(currentWeek, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentWeek]);

  const getAsignacionesParaDia = (
    trabajador: TrabajadorConAsignaciones,
    dia: Date
  ) => {
    return trabajador.asignaciones.filter((a) => {
      const inicio = parseISO(a.fechaInicio);
      const fin = a.fechaFin ? parseISO(a.fechaFin) : inicio;
      return isWithinInterval(startOfDay(dia), {
        start: startOfDay(inicio),
        end: startOfDay(fin),
      });
    });
  };

  const getAsignacionActual = (trabajador: TrabajadorConAsignaciones) => {
    const hoy = new Date();
    return trabajador.asignaciones.find((a) => {
      const inicio = parseISO(a.fechaInicio);
      const fin = a.fechaFin ? parseISO(a.fechaFin) : inicio;
      return isWithinInterval(startOfDay(hoy), {
        start: startOfDay(inicio),
        end: startOfDay(fin),
      });
    });
  };

  const getProximaAsignacion = (trabajador: TrabajadorConAsignaciones) => {
    const hoy = new Date();
    const futuras = trabajador.asignaciones
      .filter((a) => parseISO(a.fechaInicio) > hoy)
      .sort(
        (a, b) =>
          parseISO(a.fechaInicio).getTime() - parseISO(b.fechaInicio).getTime()
      );
    return futuras[0];
  };

  const getAusenciaActual = (trabajador: TrabajadorConAsignaciones) => {
    const hoy = startOfDay(new Date());
    return trabajador.ausencias?.find((a) => {
      const inicio = startOfDay(parseISO(a.fechaInicio));
      const fin = a.fechaFin ? startOfDay(parseISO(a.fechaFin)) : new Date(2099, 11, 31); // Si no hay fin, está activa
      return isWithinInterval(hoy, { start: inicio, end: fin });
    });
  };

  const getAusenciasParaDia = (trabajador: TrabajadorConAsignaciones, dia: Date) => {
    return trabajador.ausencias?.filter((a) => {
      const inicio = startOfDay(parseISO(a.fechaInicio));
      const fin = a.fechaFin ? startOfDay(parseISO(a.fechaFin)) : new Date(2099, 11, 31);
      return isWithinInterval(startOfDay(dia), { start: inicio, end: fin });
    }) || [];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const handleSelectTrabajador = (value: string) => {
    if (value === 'all') {
      setSelectedTrabajador(null);
    } else {
      const trabajador = trabajadores.find((t) => t.id === value);
      setSelectedTrabajador(trabajador || null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Planificacion</h1>
        <p className="text-muted-foreground">
          Visualiza donde esta y estara cada trabajador
        </p>
      </div>

      <Select
        value={selectedTrabajador?.id || 'all'}
        onValueChange={handleSelectTrabajador}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Trabajador" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los trabajadores</SelectItem>
          {trabajadores.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex rounded-lg border overflow-hidden">
        <button
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            vista === 'resumen'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted'
          )}
          onClick={() => setVista('resumen')}
        >
          Resumen
        </button>
        <button
          className={cn(
            'flex-1 py-2.5 text-sm font-medium transition-colors',
            vista === 'semana'
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-muted'
          )}
          onClick={() => setVista('semana')}
        >
          Vista Semanal
        </button>
      </div>

      {/* Vista Resumen */}
      {vista === 'resumen' && (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(selectedTrabajador ? [selectedTrabajador] : trabajadores).map((trabajador) => {
              const asignacionActual = getAsignacionActual(trabajador);
              const proximaAsignacion = getProximaAsignacion(trabajador);
              const ausenciaActual = getAusenciaActual(trabajador);
              const AusenciaIcon = ausenciaActual ? tipoAusenciaIcons[ausenciaActual.tipo] : null;

              return (
                <Card
                  key={trabajador.id}
                  className={cn(
                    'cursor-pointer transition-shadow hover:shadow-md',
                    selectedTrabajador?.id === trabajador.id && 'ring-2 ring-primary'
                  )}
                  onClick={() =>
                    setSelectedTrabajador(
                      selectedTrabajador?.id === trabajador.id
                        ? null
                        : trabajador
                    )
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className={cn(
                        ausenciaActual && tipoAusenciaColors[ausenciaActual.tipo]
                      )}>
                        <AvatarFallback className={cn(
                          ausenciaActual && tipoAusenciaColors[ausenciaActual.tipo]
                        )}>
                          {trabajador.nombre
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {trabajador.nombre}
                        </CardTitle>
                        {trabajador.cargo && (
                          <p className="text-sm text-muted-foreground">
                            {trabajador.cargo}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Ausencia activa - mostrar primero si existe */}
                    {ausenciaActual && (
                      <div className={cn(
                        "p-2 rounded-lg",
                        tipoAusenciaColors[ausenciaActual.tipo]
                      )}>
                        <div className="flex items-center gap-2">
                          {AusenciaIcon && <AusenciaIcon className="h-4 w-4" />}
                          <span className="font-medium text-sm">
                            {tipoAusenciaLabels[ausenciaActual.tipo]}
                          </span>
                        </div>
                        <p className="text-xs mt-1">
                          Desde {format(parseISO(ausenciaActual.fechaInicio), "d MMM", { locale: es })}
                          {ausenciaActual.fechaFin && ` hasta ${format(parseISO(ausenciaActual.fechaFin), "d MMM", { locale: es })}`}
                        </p>
                      </div>
                    )}

                    {/* Donde esta ahora - solo si no hay ausencia */}
                    {!ausenciaActual && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          AHORA
                        </p>
                        {asignacionActual ? (
                          <Link
                            href={`/obras/${asignacionActual.obra.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block"
                          >
                            <Badge
                              variant="default"
                              className="w-full justify-start py-1.5"
                            >
                              <Building2 className="h-3 w-3 mr-1" />
                              {asignacionActual.obra.nombre}
                            </Badge>
                          </Link>
                        ) : (
                          <Badge variant="secondary" className="w-full justify-start py-1.5">
                            Sin asignacion
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Proxima asignacion */}
                    {!asignacionActual && !ausenciaActual && proximaAsignacion && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          PROXIMA
                        </p>
                        <Link
                          href={`/obras/${proximaAsignacion.obra.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block"
                        >
                          <div className="text-sm bg-muted rounded-md p-2">
                            <p className="font-medium">
                              {proximaAsignacion.obra.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(
                                parseISO(proximaAsignacion.fechaInicio),
                                "d 'de' MMMM",
                                { locale: es }
                              )}
                            </p>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Total asignaciones */}
                    <p className="text-xs text-muted-foreground">
                      {trabajador.asignaciones.length} asignacion
                      {trabajador.asignaciones.length !== 1 ? 'es' : ''} total
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detalle del trabajador seleccionado */}
          {selectedTrabajador && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Agenda de {selectedTrabajador.nombre}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedTrabajador.asignaciones.length === 0 ? (
                  <p className="text-muted-foreground">
                    No hay asignaciones para este trabajador
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedTrabajador.asignaciones
                      .sort(
                        (a, b) =>
                          parseISO(a.fechaInicio).getTime() -
                          parseISO(b.fechaInicio).getTime()
                      )
                      .map((asignacion) => {
                        const inicio = parseISO(asignacion.fechaInicio);
                        const fin = asignacion.fechaFin
                          ? parseISO(asignacion.fechaFin)
                          : null;
                        const esActual =
                          isWithinInterval(new Date(), {
                            start: inicio,
                            end: fin || inicio,
                          }) || isSameDay(inicio, new Date());
                        const esPasada = fin
                          ? fin < new Date()
                          : inicio < new Date() && !isSameDay(inicio, new Date());

                        return (
                          <Link
                            key={asignacion.id}
                            href={`/obras/${asignacion.obra.id}`}
                          >
                            <div
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border',
                                esActual && 'bg-primary/10 border-primary',
                                esPasada && 'opacity-50',
                                asignacion.pendienteConfirmacion && 'border-amber-300 bg-amber-50 dark:bg-amber-950 dark:border-amber-700'
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Building2
                                  className={cn(
                                    'h-5 w-5',
                                    esActual
                                      ? 'text-primary'
                                      : 'text-muted-foreground',
                                    asignacion.pendienteConfirmacion && 'text-amber-600'
                                  )}
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">
                                      {asignacion.obra.nombre}
                                    </p>
                                    {asignacion.pendienteConfirmacion && (
                                      <Badge variant="outline" className="text-xs border-amber-500 text-amber-700 dark:text-amber-400">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Pendiente confirmar
                                      </Badge>
                                    )}
                                  </div>
                                  {asignacion.notas && (
                                    <p className="text-sm text-muted-foreground">
                                      {asignacion.notas}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <p>
                                  {format(inicio, 'dd/MM/yyyy')}
                                  {fin && ` - ${format(fin, 'dd/MM/yyyy')}`}
                                </p>
                                {esActual && (
                                  <Badge variant="default" className="mt-1">
                                    Actual
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                  </div>
                )}

                {/* Contacto */}
                <div className="flex gap-4 mt-4 pt-4 border-t text-sm">
                  {selectedTrabajador.telefono && (
                    <a
                      href={`tel:${selectedTrabajador.telefono}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Phone className="h-4 w-4" />
                      {selectedTrabajador.telefono}
                    </a>
                  )}
                  {selectedTrabajador.email && (
                    <a
                      href={`mailto:${selectedTrabajador.email}`}
                      className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <Mail className="h-4 w-4" />
                      {selectedTrabajador.email}
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Vista Semanal */}
      {vista === 'semana' && (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle className="text-base">
                  Semana del{' '}
                  {format(weekDays[0], "d 'de' MMMM", { locale: es })} al{' '}
                  {format(weekDays[6], "d 'de' MMMM", { locale: es })}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr>
                    <th className="text-left p-2 border-b w-48">Trabajador</th>
                    {weekDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={cn(
                          'text-center p-2 border-b text-sm',
                          isToday(day) && 'bg-primary/10'
                        )}
                      >
                        <div>{format(day, 'EEE', { locale: es })}</div>
                        <div
                          className={cn(
                            'text-lg',
                            isToday(day) && 'font-bold text-primary'
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(selectedTrabajador ? [selectedTrabajador] : trabajadores).map((trabajador) => (
                    <tr key={trabajador.id} className="border-b">
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {trabajador.nombre
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">
                              {trabajador.nombre}
                            </p>
                            {trabajador.cargo && (
                              <p className="text-xs text-muted-foreground">
                                {trabajador.cargo}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      {weekDays.map((day) => {
                        const asignaciones = getAsignacionesParaDia(
                          trabajador,
                          day
                        );
                        const ausencias = getAusenciasParaDia(trabajador, day);
                        return (
                          <td
                            key={day.toISOString()}
                            className={cn(
                              'p-1 text-center align-top',
                              isToday(day) && 'bg-primary/5'
                            )}
                          >
                            {/* Mostrar ausencias primero */}
                            {ausencias.map((a) => {
                              const Icon = tipoAusenciaIcons[a.tipo];
                              return (
                                <div
                                  key={a.id}
                                  className={cn(
                                    "w-full text-xs py-1 mb-1 rounded flex items-center justify-center gap-1",
                                    tipoAusenciaColors[a.tipo]
                                  )}
                                  title={tipoAusenciaLabels[a.tipo]}
                                >
                                  <Icon className="h-3 w-3" />
                                  <span className="truncate hidden lg:inline">
                                    {a.tipo === TipoAusencia.VACACIONES ? 'Vac' :
                                     a.tipo === TipoAusencia.BAJA_ENFERMEDAD ? 'Baja' :
                                     a.tipo === TipoAusencia.BAJA_ACCIDENTE ? 'Baja' :
                                     a.tipo === TipoAusencia.PERMISO ? 'Perm' : 'Aus'}
                                  </span>
                                </div>
                              );
                            })}
                            {/* Mostrar asignaciones solo si no hay ausencias */}
                            {ausencias.length === 0 && asignaciones.map((a) => (
                              <Link
                                key={a.id}
                                href={`/obras/${a.obra.id}`}
                                className="block"
                              >
                                <Badge
                                  variant={a.pendienteConfirmacion ? "outline" : "default"}
                                  className={cn(
                                    "w-full text-xs py-1 mb-1 truncate",
                                    a.pendienteConfirmacion && "border-amber-500 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300"
                                  )}
                                  title={a.pendienteConfirmacion ? `${a.obra.nombre} (Pendiente confirmar)` : a.obra.nombre}
                                >
                                  {a.pendienteConfirmacion && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                  {a.obra.nombre}
                                </Badge>
                              </Link>
                            ))}
                            {ausencias.length === 0 && asignaciones.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                -
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
