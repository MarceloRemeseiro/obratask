'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { encargadosApi } from '@/lib/api';
import { EncargadoResumen } from '@/types';
import {
  HardHat,
  Phone,
  Copy,
  Check,
  ExternalLink,
  ClipboardList,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EncargadosPage() {
  const [encargados, setEncargados] = useState<EncargadoResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState('');

  useEffect(() => {
    encargadosApi
      .getAll()
      .then(setEncargados)
      .finally(() => setLoading(false));
  }, []);

  const getPublicLink = (token: string | null) => {
    if (!token) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    return `${baseUrl}/encargado/${token}`;
  };

  const copyLink = (encargado: EncargadoResumen) => {
    const link = getPublicLink(encargado.publicToken);
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedId(encargado.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const showLinkDialog = (encargado: EncargadoResumen) => {
    setSelectedLink(getPublicLink(encargado.publicToken));
    setLinkDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-48 mt-1" />
        </div>
        <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-full mt-3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Encargados</h1>
        <p className="text-sm text-muted-foreground">
          {encargados.length} encargado{encargados.length !== 1 ? 's' : ''} activo{encargados.length !== 1 ? 's' : ''}
        </p>
      </div>

      {encargados.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <HardHat className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No hay encargados</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Para crear un encargado, ve al perfil de un trabajador y activa la opción &quot;Es encargado&quot;
            </p>
            <Button size="sm" className="mt-4" asChild>
              <Link href="/trabajadores">
                Ir a Trabajadores
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
          {encargados.map((enc) => (
            <Card key={enc.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-primary" />
                      <span className="font-medium">{enc.nombre}</span>
                    </div>
                    {enc.cargo && (
                      <p className="text-sm text-muted-foreground ml-6">{enc.cargo}</p>
                    )}
                  </div>
                  {enc.pin && (
                    <Badge variant="outline" className="text-xs font-mono">
                      PIN: {enc.pin}
                    </Badge>
                  )}
                </div>

                {/* Task summary */}
                <div className="flex gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                    <span className="text-muted-foreground">{enc.tareas.pendientes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">{enc.tareas.enProgreso}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">{enc.tareas.completadas}</span>
                  </div>
                  <span className="text-muted-foreground text-xs ml-auto">
                    {enc.tareas.total} tarea{enc.tareas.total !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/encargados/${enc.id}`}>
                      <ClipboardList className="h-4 w-4 mr-1" />
                      Ver tareas
                    </Link>
                  </Button>
                  {enc.publicToken && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyLink(enc)}
                      title="Copiar enlace público"
                    >
                      {copiedId === enc.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  {enc.telefono && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <a href={`tel:${enc.telefono}`} title="Llamar">
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Link dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Enlace público</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input readOnly value={selectedLink} className="font-mono text-xs" />
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(selectedLink);
                  setLinkDialogOpen(false);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </Button>
              <Button variant="outline" asChild>
                <a href={selectedLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir
                </a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
