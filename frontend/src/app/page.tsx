'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ObraCard } from '@/components/obras/ObraCard';
import { obrasApi, trabajadoresApi } from '@/lib/api';
import { Obra, Trabajador, EstadoObra } from '@/types';
import { Building2, Users, ClipboardList, AlertCircle } from 'lucide-react';
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
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
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
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Obras Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{obrasActivas.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trabajadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{trabajadores.length}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tareas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{totalTareas}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Listas para Cerrar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
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
            <CardContent className="py-8 text-center text-muted-foreground">
              No hay obras activas
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
