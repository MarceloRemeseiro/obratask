'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObraCard } from '@/components/obras/ObraCard';
import { ObraForm } from '@/components/obras/ObraForm';
import { obrasApi } from '@/lib/api';
import { Obra, EstadoObra } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Building2 } from 'lucide-react';

export default function ObrasPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | EstadoObra>('todas');

  const loadObras = () => {
    setLoading(true);
    obrasApi
      .getAll()
      .then(setObras)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadObras();
  }, []);

  const obrasFiltradas =
    filtro === 'todas' ? obras : obras.filter((o) => o.estado === filtro);

  const contarPorEstado = (estado?: EstadoObra) =>
    estado ? obras.filter((o) => o.estado === estado).length : obras.length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-56 mt-2" />
          </div>
          <Skeleton className="h-9 w-28" />
        </div>
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Obras</h1>
          <p className="text-muted-foreground">
            Gestion de obras de construccion
          </p>
        </div>
        <ObraForm onSuccess={loadObras} />
      </div>

      <Tabs
        value={filtro}
        onValueChange={(v) => setFiltro(v as typeof filtro)}
      >
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="w-max md:w-auto">
            <TabsTrigger value="todas" className="text-xs md:text-sm">
              Todas ({contarPorEstado()})
            </TabsTrigger>
            <TabsTrigger
              value={EstadoObra.EN_PROGRESO}
              className="text-xs md:text-sm"
            >
              Progreso ({contarPorEstado(EstadoObra.EN_PROGRESO)})
            </TabsTrigger>
            <TabsTrigger
              value={EstadoObra.SIN_INICIAR}
              className="text-xs md:text-sm"
            >
              Sin iniciar ({contarPorEstado(EstadoObra.SIN_INICIAR)})
            </TabsTrigger>
            <TabsTrigger
              value={EstadoObra.COMPLETADA}
              className="text-xs md:text-sm"
            >
              Completadas ({contarPorEstado(EstadoObra.COMPLETADA)})
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {obrasFiltradas.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground font-medium">
            {filtro !== 'todas' ? 'No hay obras con este estado' : 'No hay obras'}
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {filtro === 'todas' ? 'Crea tu primera obra para empezar' : 'Prueba con otro filtro'}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {obrasFiltradas.map((obra) => (
            <ObraCard key={obra.id} obra={obra} />
          ))}
        </div>
      )}
    </div>
  );
}
