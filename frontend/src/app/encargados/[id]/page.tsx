'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { encargadosApi } from '@/lib/api';
import { EncargadoDetalle, TareaComentario, AutorComentario, EstadoTarea, Tarea } from '@/types';
import {
  ArrowLeft,
  HardHat,
  Send,
  Building2,
  MessageSquare,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const estadoLabels: Record<string, { label: string; color: string }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-500' },
  EN_PROGRESO: { label: 'En progreso', color: 'bg-blue-500' },
  COMPLETADO: { label: 'Completado', color: 'bg-green-500' },
};

export default function EncargadoDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [encargado, setEncargado] = useState<EncargadoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTareaId, setSelectedTareaId] = useState<string | null>(null);
  const [comentarios, setComentarios] = useState<TareaComentario[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  useEffect(() => {
    encargadosApi
      .getById(id)
      .then(setEncargado)
      .finally(() => setLoading(false));
  }, [id]);

  // Poll comments every 3s when a task is selected
  useEffect(() => {
    if (!selectedTareaId) return;
    const interval = setInterval(async () => {
      try {
        const data = await encargadosApi.getComentarios(selectedTareaId);
        setComentarios(data);
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedTareaId]);

  // Find the selected tarea object for photo display
  const selectedTarea = selectedTareaId
    ? encargado?.tareasPorObra.flatMap((g) => g.tareas).find((t) => t.id === selectedTareaId)
    : null;

  const loadComentarios = async (tareaId: string) => {
    setSelectedTareaId(tareaId);
    const data = await encargadosApi.getComentarios(tareaId);
    setComentarios(data);
  };

  const handleSendComment = async () => {
    if (!selectedTareaId || !comentarioTexto.trim()) return;
    setSendingComment(true);
    try {
      await encargadosApi.createComentario(selectedTareaId, comentarioTexto.trim());
      setComentarioTexto('');
      await loadComentarios(selectedTareaId);
    } catch (error) {
      alert('Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!encargado) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Encargado no encontrado</p>
        <Button asChild variant="outline">
          <Link href="/encargados">Volver</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/encargados">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-primary" />
            <h1 className="text-xl md:text-2xl font-bold">{encargado.nombre}</h1>
          </div>
          {encargado.cargo && (
            <p className="text-sm text-muted-foreground ml-7">{encargado.cargo}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,400px]">
        {/* Tasks by obra */}
        <div className="space-y-4">
          {encargado.tareasPorObra.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No tiene tareas asignadas
              </CardContent>
            </Card>
          ) : (
            encargado.tareasPorObra.map((grupo) => (
              <Card key={grupo.obra.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    {grupo.obra.nombre}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {grupo.tareas.map((tarea) => {
                    const estado = estadoLabels[tarea.estado] || estadoLabels.PENDIENTE;
                    const isSelected = selectedTareaId === tarea.id;
                    return (
                      <div
                        key={tarea.id}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        )}
                        onClick={() => loadComentarios(tarea.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', estado.color)} />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{tarea.titulo}</p>
                            {tarea.subtareas && tarea.subtareas.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {tarea.subtareas.filter((s) => s.estado === 'COMPLETADO').length}/{tarea.subtareas.length} subtareas
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {tarea.archivos && tarea.archivos.length > 0 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Camera className="h-3 w-3" />
                              {tarea.archivos.length}
                            </Badge>
                          )}
                          {tarea.comentarios && tarea.comentarios.length > 0 && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {tarea.comentarios.length}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {estado.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Photos + Comments panel */}
        <div className="lg:sticky lg:top-4 lg:self-start space-y-4">
          {/* Photos */}
          {selectedTarea?.archivos && selectedTarea.archivos.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos ({selectedTarea.archivos.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {selectedTarea.archivos.map((archivo) => (
                    <a
                      key={archivo.id}
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={archivo.url}
                        alt={archivo.nombreOriginal}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedTareaId ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecciona una tarea para ver sus comentarios
                </p>
              ) : (
                <div className="space-y-3">
                  {/* Comment list */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {comentarios.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Sin comentarios
                      </p>
                    ) : (
                      comentarios.map((c) => (
                        <div
                          key={c.id}
                          className={cn(
                            'p-2.5 rounded-lg text-sm',
                            c.autor === AutorComentario.ADMIN
                              ? 'bg-primary/10 ml-4'
                              : 'bg-muted mr-4'
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">
                              {c.autorNombre}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(parseISO(c.createdAt), "d MMM HH:mm", { locale: es })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{c.texto}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment input */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Textarea
                      value={comentarioTexto}
                      onChange={(e) => setComentarioTexto(e.target.value)}
                      placeholder="Escribe un comentario..."
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendComment();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={handleSendComment}
                      disabled={sendingComment || !comentarioTexto.trim()}
                      className="shrink-0 self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
