'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, ClipboardList } from 'lucide-react';
import { Obra, EstadoObra } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ObraCardProps {
  obra: Obra;
}

const estadoConfig: Record<
  EstadoObra,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  [EstadoObra.SIN_INICIAR]: { label: 'Sin iniciar', variant: 'secondary' },
  [EstadoObra.EN_PROGRESO]: { label: 'En progreso', variant: 'default' },
  [EstadoObra.LISTA_PARA_CERRAR]: { label: 'Lista para cerrar', variant: 'outline' },
  [EstadoObra.COMPLETADA]: { label: 'Completada', variant: 'secondary' },
};

export function ObraCard({ obra }: ObraCardProps) {
  const config = estadoConfig[obra.estado];
  const tareasCount = obra.tareas?.length || 0;
  const trabajadoresCount = obra.obrasTrabajador?.length || 0;

  return (
    <Link href={`/obras/${obra.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="p-3 md:p-4 pb-1 md:pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base md:text-lg line-clamp-1">{obra.nombre}</CardTitle>
            <Badge variant={config.variant} className="text-[10px] md:text-xs shrink-0">
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-4 pt-0">
          {obra.descripcion && (
            <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-1 md:line-clamp-2">
              {obra.descripcion}
            </p>
          )}
          <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
            {obra.fechaInicioPrev && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 md:h-4 md:w-4" />
                <span>
                  {format(new Date(obra.fechaInicioPrev), 'dd MMM', { locale: es })}
                  {obra.fechaFinPrev &&
                    ` - ${format(new Date(obra.fechaFinPrev), 'dd MMM', { locale: es })}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <ClipboardList className="h-3 w-3 md:h-4 md:w-4" />
              <span>{tareasCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 md:h-4 md:w-4" />
              <span>{trabajadoresCount}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
