'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, MoreVertical, ListChecks, Trash2, Edit, User } from 'lucide-react';
import { Tarea, PrioridadTarea, EstadoTarea } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface TareaCardProps {
  tarea: Tarea;
  onEdit?: () => void;
  onDelete?: () => void;
  isDragging?: boolean;
}

const prioridadConfig: Record<
  PrioridadTarea,
  { label: string; className: string }
> = {
  [PrioridadTarea.BAJA]: { label: 'Baja', className: 'bg-green-100 text-green-800' },
  [PrioridadTarea.MEDIA]: { label: 'Media', className: 'bg-yellow-100 text-yellow-800' },
  [PrioridadTarea.ALTA]: { label: 'Alta', className: 'bg-red-100 text-red-800' },
};

export function TareaCard({ tarea, onEdit, onDelete, isDragging }: TareaCardProps) {
  const config = prioridadConfig[tarea.prioridad];
  const subtareasCompletadas =
    tarea.subtareas?.filter((s) => s.estado === EstadoTarea.COMPLETADO).length || 0;
  const totalSubtareas = tarea.subtareas?.length || 0;

  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing transition-shadow py-0 gap-0',
        isDragging && 'shadow-lg opacity-50'
      )}
    >
      <CardContent className="p-3 !px-3">
        {/* Title + Menu */}
        <div className="flex items-start justify-between gap-1">
          <h3 className="text-base font-semibold line-clamp-2 leading-tight">
            {tarea.titulo}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 -mt-0.5 -mr-1">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {tarea.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {tarea.descripcion}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1 items-center mt-2 pt-2 border-t border-border/40">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              tarea.prioridad === PrioridadTarea.ALTA && "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400",
              tarea.prioridad === PrioridadTarea.MEDIA && "border-yellow-300 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400",
              tarea.prioridad === PrioridadTarea.BAJA && "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
            )}
          >
            {config.label}
          </Badge>
          {tarea.trabajador ? (
            <Badge variant="secondary" className="gap-1 text-[10px] px-1.5 py-0">
              <User className="h-2.5 w-2.5" />
              {tarea.trabajador.nombre.split(' ')[0]}
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 text-muted-foreground">
              <User className="h-2.5 w-2.5" />
              No asignada
            </Badge>
          )}
          {tarea.fechaLimite && (
            <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
              <Calendar className="h-2.5 w-2.5" />
              {format(new Date(tarea.fechaLimite), 'dd MMM', { locale: es })}
            </Badge>
          )}
          {totalSubtareas > 0 && (
            <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0">
              <ListChecks className="h-2.5 w-2.5" />
              {subtareasCompletadas}/{totalSubtareas}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
