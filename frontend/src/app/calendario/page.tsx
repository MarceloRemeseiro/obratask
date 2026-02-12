'use client';

import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { obrasApi, trabajadoresApi } from '@/lib/api';
import { Obra, Trabajador, ObraTrabajador, EstadoObra, TrabajadorAusencia, TipoAusencia } from '@/types';
import { ChevronLeft, ChevronRight, Building2, User, Palmtree, Stethoscope, HeartPulse, Calendar, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface CalendarEvent {
  type: 'obra' | 'trabajador' | 'ausencia';
  id: string;
  nombre: string;
  obraId?: string;
  obraNombre?: string;
  tipoAusencia?: TipoAusencia;
  pendienteConfirmacion?: boolean;
  fechaInicio: Date;
  fechaFin?: Date;
  color: string;
  icon?: 'building' | 'user' | 'palmtree' | 'stethoscope' | 'heartpulse' | 'calendar';
}

const estadoColors: Record<EstadoObra, string> = {
  [EstadoObra.SIN_INICIAR]: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  [EstadoObra.EN_PROGRESO]: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  [EstadoObra.LISTA_PARA_CERRAR]: 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
  [EstadoObra.COMPLETADA]: 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200',
};

const ausenciaColors: Record<TipoAusencia, string> = {
  [TipoAusencia.VACACIONES]: 'bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200',
  [TipoAusencia.BAJA_ENFERMEDAD]: 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200',
  [TipoAusencia.BAJA_ACCIDENTE]: 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200',
  [TipoAusencia.PERMISO]: 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
  [TipoAusencia.OTRO]: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
};

const tipoAusenciaLabels: Record<TipoAusencia, string> = {
  [TipoAusencia.VACACIONES]: 'Vacaciones',
  [TipoAusencia.BAJA_ENFERMEDAD]: 'Baja enfermedad',
  [TipoAusencia.BAJA_ACCIDENTE]: 'Baja accidente',
  [TipoAusencia.PERMISO]: 'Permiso',
  [TipoAusencia.OTRO]: 'Otro',
};

export default function CalendarioPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    Promise.all([obrasApi.getAll(), trabajadoresApi.getAll()])
      .then(([obrasData, trabajadoresData]) => {
        setObras(obrasData);
        setTrabajadores(trabajadoresData);
      })
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => {
    const result: CalendarEvent[] = [];

    obras.forEach((obra) => {
      // Add obra as event if it has dates
      if (obra.fechaInicioPrev) {
        result.push({
          type: 'obra',
          id: obra.id,
          nombre: obra.nombre,
          fechaInicio: parseISO(obra.fechaInicioPrev),
          fechaFin: obra.fechaFinPrev ? parseISO(obra.fechaFinPrev) : undefined,
          color: estadoColors[obra.estado],
          icon: 'building',
        });
      }

      // Add worker assignments
      obra.obrasTrabajador?.forEach((asignacion) => {
        if (asignacion.trabajador && asignacion.fechaInicio) {
          const isPending = asignacion.pendienteConfirmacion;
          result.push({
            type: 'trabajador',
            id: asignacion.id,
            nombre: asignacion.trabajador.nombre,
            obraId: obra.id,
            obraNombre: obra.nombre,
            pendienteConfirmacion: isPending,
            fechaInicio: parseISO(asignacion.fechaInicio),
            fechaFin: asignacion.fechaFin
              ? parseISO(asignacion.fechaFin)
              : undefined,
            color: isPending
              ? 'bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border border-amber-400 dark:border-amber-600'
              : 'bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
            icon: 'user',
          });
        }
      });
    });

    // Add worker ausencias
    trabajadores.forEach((trabajador) => {
      trabajador.ausencias?.forEach((ausencia) => {
        const iconMap: Record<TipoAusencia, CalendarEvent['icon']> = {
          [TipoAusencia.VACACIONES]: 'palmtree',
          [TipoAusencia.BAJA_ENFERMEDAD]: 'stethoscope',
          [TipoAusencia.BAJA_ACCIDENTE]: 'heartpulse',
          [TipoAusencia.PERMISO]: 'calendar',
          [TipoAusencia.OTRO]: 'calendar',
        };
        result.push({
          type: 'ausencia',
          id: ausencia.id,
          nombre: trabajador.nombre,
          tipoAusencia: ausencia.tipo,
          fechaInicio: parseISO(ausencia.fechaInicio),
          fechaFin: ausencia.fechaFin ? parseISO(ausencia.fechaFin) : undefined,
          color: ausenciaColors[ausencia.tipo],
          icon: iconMap[ausencia.tipo],
        });
      });
    });

    return result;
  }, [obras, trabajadores]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => {
      const eventStart = event.fechaInicio;
      const eventEnd = event.fechaFin || eventStart;

      return isWithinInterval(day, { start: eventStart, end: eventEnd });
    });
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="text-muted-foreground">
          Vista de obras y asignaciones de trabajadores
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: es })}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before first of month */}
              {Array.from({
                length: (days[0].getDay() + 6) % 7,
              }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px]" />
              ))}

              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`min-h-[80px] p-1 border rounded-lg text-left transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent hover:bg-muted'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isToday
                          ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                          : ''
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((event, i) => {
                        const IconComponent =
                          event.icon === 'building' ? Building2 :
                          event.icon === 'user' ? User :
                          event.icon === 'palmtree' ? Palmtree :
                          event.icon === 'stethoscope' ? Stethoscope :
                          event.icon === 'heartpulse' ? HeartPulse :
                          event.icon === 'calendar' ? Calendar : Building2;
                        return (
                          <div
                            key={`${event.id}-${i}`}
                            className={`text-xs px-1 py-0.5 rounded truncate ${event.color}`}
                          >
                            <span className="flex items-center gap-1">
                              <IconComponent className="h-2 w-2 shrink-0" />
                              <span className="truncate">{event.nombre}</span>
                            </span>
                          </div>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <p className="text-xs text-muted-foreground px-1">
                          +{dayEvents.length - 3} mas
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected day details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {selectedDate
                ? format(selectedDate, "d 'de' MMMM", { locale: es })
                : 'Selecciona un dia'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Haz clic en un dia para ver los eventos
              </p>
            ) : selectedDayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay eventos para este dia
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayEvents.map((event, i) => {
                  const IconComponent =
                    event.icon === 'building' ? Building2 :
                    event.icon === 'user' ? User :
                    event.icon === 'palmtree' ? Palmtree :
                    event.icon === 'stethoscope' ? Stethoscope :
                    event.icon === 'heartpulse' ? HeartPulse :
                    event.icon === 'calendar' ? Calendar : Building2;
                  return (
                    <div
                      key={`${event.id}-${i}`}
                      className={`p-3 rounded-lg ${event.color}`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <IconComponent className="h-4 w-4" />
                        {event.nombre}
                      </div>
                      {event.type === 'obra' && (
                        <Link
                          href={`/obras/${event.id}`}
                          className="text-sm hover:underline"
                        >
                          Ver obra
                        </Link>
                      )}
                      {event.type === 'trabajador' && (
                        <div className="text-sm">
                          <p>
                            Asignado a:{' '}
                            <Link
                              href={`/obras/${event.obraId}`}
                              className="hover:underline"
                            >
                              {event.obraNombre}
                            </Link>
                          </p>
                          {event.pendienteConfirmacion && (
                            <p className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-medium mt-1">
                              <AlertCircle className="h-3 w-3" />
                              Pendiente de confirmar
                            </p>
                          )}
                        </div>
                      )}
                      {event.type === 'ausencia' && event.tipoAusencia && (
                        <p className="text-sm">
                          {tipoAusenciaLabels[event.tipoAusencia]}
                        </p>
                      )}
                      <p className="text-xs opacity-75 mt-1">
                        {format(event.fechaInicio, 'dd/MM/yyyy')}
                        {event.fechaFin &&
                          ` - ${format(event.fechaFin, 'dd/MM/yyyy')}`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardContent className="py-3">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Obras</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <div className="w-3 h-3 rounded bg-gray-200 dark:bg-gray-700" />
                <span>Sin iniciar</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900" />
                <span>En progreso</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <div className="w-3 h-3 rounded bg-yellow-200 dark:bg-yellow-900" />
                <span>Lista para cerrar</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900" />
                <span>Completada</span>
              </div>
            </div>
            <p className="text-xs font-medium text-muted-foreground pt-2">Trabajadores</p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div className="w-3 h-3 rounded bg-purple-200 dark:bg-purple-900" />
                <span>Asignación confirmada</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <div className="w-3 h-3 rounded bg-amber-200 dark:bg-amber-900 border border-amber-400" />
                <span>Pendiente confirmar</span>
              </div>
              <div className="flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900" />
                <span>Vacaciones</span>
              </div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-red-600 dark:text-red-400" />
                <div className="w-3 h-3 rounded bg-red-200 dark:bg-red-900" />
                <span>Baja</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <div className="w-3 h-3 rounded bg-blue-200 dark:bg-blue-900" />
                <span>Permiso</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
