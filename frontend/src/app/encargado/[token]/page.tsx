'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { publicEncargadoApi } from '@/lib/api';
import {
  Tarea,
  TareaComentario,
  AutorComentario,
  EstadoTarea,
  VerifyResponse,
} from '@/types';
import {
  HardHat,
  Send,
  Camera,
  Building2,
  MessageSquare,
  ArrowLeft,
  Check,
  Clock,
  CircleDot,
  Loader2,
  Lock,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const estadoConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  PENDIENTE: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
  EN_PROGRESO: { label: 'En progreso', color: 'bg-blue-500', icon: CircleDot },
  COMPLETADO: { label: 'Completado', color: 'bg-green-500', icon: Check },
};

export default function PublicEncargadoPage() {
  const params = useParams();
  const token = params.token as string;

  // Auth state
  const [pin, setPin] = useState('');
  const [verified, setVerified] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Data state
  const [encargadoData, setEncargadoData] = useState<VerifyResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'mis' | 'equipo'>('mis');
  const [selectedTarea, setSelectedTarea] = useState<Tarea | null>(null);
  const [comentarios, setComentarios] = useState<TareaComentario[]>([]);
  const [comentarioTexto, setComentarioTexto] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingEstado, setUpdatingEstado] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Poll comments every 3s when a task is selected
  useEffect(() => {
    if (!selectedTarea || !verified) return;
    const interval = setInterval(async () => {
      try {
        const data = await publicEncargadoApi.getComentarios(token, pin, selectedTarea.id);
        setComentarios(data);
      } catch {
        // ignore polling errors
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedTarea?.id, verified, token, pin]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setVerifyError('');
    try {
      const data = await publicEncargadoApi.verify(token, pin);
      setEncargadoData(data);
      setVerified(true);
    } catch (error) {
      setVerifyError(error instanceof Error ? error.message : 'PIN incorrecto');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectTarea = async (tarea: Tarea) => {
    setSelectedTarea(tarea);
    try {
      const data = await publicEncargadoApi.getComentarios(token, pin, tarea.id);
      setComentarios(data);
    } catch {
      setComentarios([]);
    }
  };

  const handleBack = () => {
    setSelectedTarea(null);
    setComentarios([]);
    setComentarioTexto('');
  };

  const handleUpdateEstado = async (estado: EstadoTarea) => {
    if (!selectedTarea) return;
    setUpdatingEstado(true);
    try {
      const updated = await publicEncargadoApi.updateTareaEstado(token, pin, selectedTarea.id, estado);
      setSelectedTarea({ ...selectedTarea, estado: updated.estado });
      // Update in the main lists too
      if (encargadoData) {
        setEncargadoData({
          ...encargadoData,
          misTareas: encargadoData.misTareas.map((t) =>
            t.id === selectedTarea.id ? { ...t, estado: updated.estado } : t,
          ),
          tareasEquipo: encargadoData.tareasEquipo.map((t) =>
            t.id === selectedTarea.id ? { ...t, estado: updated.estado } : t,
          ),
        });
      }
    } catch (error) {
      alert('Error al actualizar estado');
    } finally {
      setUpdatingEstado(false);
    }
  };

  const handleSendComment = async () => {
    if (!selectedTarea || !comentarioTexto.trim()) return;
    setSendingComment(true);
    try {
      await publicEncargadoApi.createComentario(token, pin, selectedTarea.id, comentarioTexto.trim());
      setComentarioTexto('');
      const data = await publicEncargadoApi.getComentarios(token, pin, selectedTarea.id);
      setComentarios(data);
    } catch {
      alert('Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  };

  const handleUploadFoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTarea) return;
    setUploadingFoto(true);
    try {
      await publicEncargadoApi.uploadFoto(token, pin, selectedTarea.id, file);
      alert('Foto subida correctamente');
    } catch {
      alert('Error al subir foto');
    } finally {
      setUploadingFoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // PIN entry screen
  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <HardHat className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Panel de Encargado</CardTitle>
            <p className="text-sm text-muted-foreground">
              Introduce tu PIN para acceder
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex justify-center">
                <Input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                  }}
                  placeholder="- - - -"
                  className="text-center text-2xl tracking-[0.5em] w-48 h-14 font-mono"
                  autoFocus
                />
              </div>
              {verifyError && (
                <p className="text-sm text-destructive text-center">{verifyError}</p>
              )}
              <Button type="submit" className="w-full" disabled={verifying || pin.length < 4}>
                {verifying ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Acceder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Task detail view
  if (selectedTarea) {
    const estado = estadoConfig[selectedTarea.estado] || estadoConfig.PENDIENTE;
    const EstadoIcon = estado.icon;

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold truncate">{selectedTarea.titulo}</h2>
              <p className="text-xs text-muted-foreground">
                {(selectedTarea as any).obra?.nombre}
                {selectedTarea.trabajador?.nombre && selectedTarea.trabajadorId !== encargadoData?.encargado.id && (
                  <> &middot; {selectedTarea.trabajador.nombre}</>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Status toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            {Object.entries(estadoConfig).map(([key, cfg]) => {
              const isActive = selectedTarea.estado === key;
              return (
                <button
                  key={key}
                  className={cn(
                    'flex-1 py-2 text-xs font-medium transition-colors disabled:opacity-50',
                    isActive
                      ? `${cfg.color} text-white`
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                  disabled={updatingEstado}
                  onClick={() => handleUpdateEstado(key as EstadoTarea)}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Description */}
          {selectedTarea.descripcion && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">Descripcion</p>
                <p className="text-sm whitespace-pre-wrap">{selectedTarea.descripcion}</p>
              </CardContent>
            </Card>
          )}

          {/* Subtareas */}
          {selectedTarea.subtareas && selectedTarea.subtareas.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">Subtareas</p>
                <div className="space-y-1.5">
                  {selectedTarea.subtareas.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full shrink-0',
                          sub.estado === 'COMPLETADO'
                            ? 'bg-green-500'
                            : sub.estado === 'EN_PROGRESO'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                        )}
                      />
                      <span className={cn(sub.estado === 'COMPLETADO' && 'line-through text-muted-foreground')}>
                        {sub.titulo}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo upload */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFoto}
          >
            {uploadingFoto ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {uploadingFoto ? 'Subiendo...' : 'Subir foto'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleUploadFoto}
          />

          {/* Comments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentarios ({comentarios.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                        <span className="font-medium text-xs">{c.autorNombre}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(c.createdAt), "d MMM HH:mm", { locale: es })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap">{c.texto}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Textarea
                  value={comentarioTexto}
                  onChange={(e) => setComentarioTexto(e.target.value)}
                  placeholder="Escribe un comentario..."
                  rows={2}
                  className="resize-none"
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
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Task list view
  const activeTareas = activeTab === 'mis'
    ? encargadoData?.misTareas ?? []
    : encargadoData?.tareasEquipo ?? [];

  const tareasPorObra = new Map<string, { obraNombre: string; tareas: Tarea[] }>();
  activeTareas.forEach((tarea) => {
    const obraId = tarea.obraId;
    const obraNombre = (tarea as any).obra?.nombre || 'Obra';
    if (!tareasPorObra.has(obraId)) {
      tareasPorObra.set(obraId, { obraNombre, tareas: [] });
    }
    tareasPorObra.get(obraId)!.tareas.push(tarea);
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground px-4 py-4">
        <div className="flex items-center gap-3">
          <HardHat className="h-6 w-6" />
          <div>
            <h1 className="font-bold text-lg">{encargadoData?.encargado.nombre}</h1>
            <p className="text-xs opacity-80">{encargadoData?.encargado.cargo || 'Encargado'}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Tab toggle */}
        <div className="flex rounded-lg border overflow-hidden">
          <button
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'mis'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setActiveTab('mis')}
          >
            Mis tareas
            {(encargadoData?.misTareas.length ?? 0) > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({encargadoData?.misTareas.length})</span>
            )}
          </button>
          <button
            className={cn(
              'flex-1 py-2.5 text-sm font-medium transition-colors',
              activeTab === 'equipo'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-muted-foreground hover:bg-muted'
            )}
            onClick={() => setActiveTab('equipo')}
          >
            Equipo
            {(encargadoData?.tareasEquipo.length ?? 0) > 0 && (
              <span className="ml-1.5 text-xs opacity-80">({encargadoData?.tareasEquipo.length})</span>
            )}
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Pendientes', count: activeTareas.filter((t) => t.estado === 'PENDIENTE').length, color: 'bg-yellow-500' },
            { label: 'En progreso', count: activeTareas.filter((t) => t.estado === 'EN_PROGRESO').length, color: 'bg-blue-500' },
            { label: 'Completadas', count: activeTareas.filter((t) => t.estado === 'COMPLETADO').length, color: 'bg-green-500' },
          ].map((item) => (
            <Card key={item.label}>
              <CardContent className="py-3 text-center">
                <div className={cn('h-2 w-2 rounded-full mx-auto mb-1', item.color)} />
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tasks by obra */}
        {Array.from(tareasPorObra.entries()).map(([obraId, { obraNombre, tareas }]) => (
          <div key={obraId} className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">{obraNombre}</h2>
            </div>
            {tareas.map((tarea) => {
              const estado = estadoConfig[tarea.estado] || estadoConfig.PENDIENTE;
              return (
                <Card
                  key={tarea.id}
                  className="cursor-pointer active:scale-[0.98] transition-transform"
                  onClick={() => handleSelectTarea(tarea)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      <span className={cn('h-3 w-3 rounded-full shrink-0', estado.color)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{tarea.titulo}</p>
                        {activeTab === 'equipo' && tarea.trabajador?.nombre && (
                          <p className="text-xs text-primary/70 truncate">
                            {tarea.trabajador.nombre}
                          </p>
                        )}
                        {tarea.descripcion && (
                          <p className="text-xs text-muted-foreground truncate">
                            {tarea.descripcion}
                          </p>
                        )}
                      </div>
                      {(tarea as any).unreadCount > 0 && (
                        <span className="h-2.5 w-2.5 rounded-full bg-destructive shrink-0" />
                      )}
                      {tarea.comentarios && tarea.comentarios.length > 0 && (
                        <Badge variant="secondary" className="text-xs gap-1 shrink-0">
                          <MessageSquare className="h-3 w-3" />
                          {tarea.comentarios.length}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ))}

        {activeTareas.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <HardHat className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground font-medium">
                {activeTab === 'mis' ? 'No tienes tareas asignadas' : 'No hay tareas de equipo'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
