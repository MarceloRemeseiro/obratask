'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ObraCard } from '@/components/obras/ObraCard';
import { obrasApi, trabajadoresApi } from '@/lib/api';
import { Obra, Trabajador, EstadoObra } from '@/types';
import { Building2, Users, ClipboardList, AlertCircle, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function Dashboard() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([obrasApi.getAll(), trabajadoresApi.getAll()])
      .then(([obrasData, trabajadoresData]) => {
        setObras(obrasData);
        setTrabajadores(trabajadoresData);
      })
      .finally(() => setLoading(false));
  }, []);

  const obrasActivas = obras.filter(
    (o) =>
      o.estado === EstadoObra.EN_PROGRESO ||
      o.estado === EstadoObra.LISTA_PARA_CERRAR
  );
  const obrasListasParaCerrar = obras.filter(
    (o) => o.estado === EstadoObra.LISTA_PARA_CERRAR
  );
  const totalTareas = obras.reduce((acc, o) => acc + (o.tareas?.length || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="p-4 pb-2">
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <Skeleton className="h-4 w-full mt-2" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de las obras</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Obras Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-2xl font-bold">{obrasActivas.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-violet-50/50 dark:bg-violet-950/30 border-violet-200/50 dark:border-violet-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              <span className="text-2xl font-bold">{trabajadores.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200/50 dark:border-emerald-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-2xl font-bold">{totalTareas}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Listas para Cerrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-2xl font-bold">
                {obrasListasParaCerrar.length}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Obras que requieren atencion */}
      {obrasListasParaCerrar.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Listas para cerrar
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obrasListasParaCerrar.map((obra) => (
              <ObraCard key={obra.id} obra={obra} />
            ))}
          </div>
        </div>
      )}

      {/* Obras activas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Obras Activas</h2>
          <Link
            href="/obras"
            className="text-sm text-primary hover:underline"
          >
            Ver todas
          </Link>
        </div>
        {obrasActivas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">No hay obras activas</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Crea una obra para empezar a gestionar tareas</p>
              <Link href="/obras">
                <Button size="sm" className="mt-4">
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva obra
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {obrasActivas.slice(0, 6).map((obra) => (
              <ObraCard key={obra.id} obra={obra} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
