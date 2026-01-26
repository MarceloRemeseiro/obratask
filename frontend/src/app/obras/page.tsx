'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ObraCard } from '@/components/obras/ObraCard';
import { ObraForm } from '@/components/obras/ObraForm';
import { obrasApi } from '@/lib/api';
import { Obra, EstadoObra } from '@/types';

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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
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
        <div className="text-center py-12 text-muted-foreground">
          No hay obras {filtro !== 'todas' && 'con este estado'}
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
