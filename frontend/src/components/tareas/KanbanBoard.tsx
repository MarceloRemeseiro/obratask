'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  CheckCircle2,
  MoreVertical,
  Edit as EditIcon,
  Trash2,
  User,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TareaCard } from './TareaCard';
import { tareasApi } from '@/lib/api';
import { Tarea, EstadoTarea, PrioridadTarea, CreateTareaDto, Trabajador, ObraTrabajador } from '@/types';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  obraId: string;
  tareas: Tarea[];
  trabajadoresAsignados: ObraTrabajador[];
  onUpdate: () => void;
}

const columnas: { id: EstadoTarea; titulo: string }[] = [
  { id: EstadoTarea.PENDIENTE, titulo: 'Pendiente' },
  { id: EstadoTarea.EN_PROGRESO, titulo: 'En Progreso' },
  { id: EstadoTarea.COMPLETADO, titulo: 'Completado' },
];

export function KanbanBoard({ obraId, tareas, trabajadoresAsignados, onUpdate }: KanbanBoardProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTarea, setEditingTarea] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTareaDto>({
    titulo: '',
    descripcion: '',
    prioridad: PrioridadTarea.MEDIA,
    fechaLimite: '',
    trabajadorId: '',
  });

  const tareasPorEstado = (estado: EstadoTarea) =>
    tareas.filter((t) => t.estado === estado).sort((a, b) => a.orden - b.orden);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        trabajadorId: formData.trabajadorId || null,
      };

      if (editingTarea) {
        await tareasApi.update(obraId, editingTarea.id, dataToSend);
      } else {
        if (!dataToSend.trabajadorId) {
          delete (dataToSend as any).trabajadorId;
        }
        await tareasApi.create(obraId, dataToSend);
      }
      setDialogOpen(false);
      resetForm();
      onUpdate();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEstadoChange = async (tareaId: string, nuevoEstado: EstadoTarea) => {
    try {
      await tareasApi.update(obraId, tareaId, { estado: nuevoEstado });
      onUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (tareaId: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      await tareasApi.delete(obraId, tareaId);
      onUpdate();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEdit = (tarea: Tarea) => {
    setEditingTarea(tarea);
    setFormData({
      titulo: tarea.titulo,
      descripcion: tarea.descripcion || '',
      prioridad: tarea.prioridad,
      fechaLimite: tarea.fechaLimite?.split('T')[0] || '',
      trabajadorId: tarea.trabajadorId || '',
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTarea(null);
    setFormData({
      titulo: '',
      descripcion: '',
      prioridad: PrioridadTarea.MEDIA,
      fechaLimite: '',
      trabajadorId: '',
    });
  };

  const KanbanColumn = ({
    estado,
    titulo,
  }: {
    estado: EstadoTarea;
    titulo: string;
  }) => (
    <div className="flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm">{titulo}</h3>
        <span className="text-xs text-muted-foreground">
          {tareasPorEstado(estado).length}
        </span>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-2">
          {tareasPorEstado(estado).map((tarea) => (
            <div
              key={tarea.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('tareaId', tarea.id);
                e.dataTransfer.setData('fromEstado', tarea.estado);
              }}
            >
              <TareaCard
                tarea={tarea}
                onEdit={() => handleEdit(tarea)}
                onDelete={() => handleDelete(tarea.id)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
      <div
        className="min-h-[60px] border-2 border-dashed border-muted rounded-lg mt-2 flex items-center justify-center text-xs text-muted-foreground"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const tareaId = e.dataTransfer.getData('tareaId');
          const fromEstado = e.dataTransfer.getData('fromEstado');
          if (fromEstado !== estado) {
            handleEstadoChange(tareaId, estado);
          }
        }}
      >
        Arrastrar aqui
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Tareas</h2>
        <Button
          size="sm"
          onClick={() => {
            resetForm();
            setDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </div>

      {/* Mobile: Lista compacta */}
      <div className="md:hidden space-y-2">
        {tareas.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">
            No hay tareas. Crea una nueva.
          </p>
        ) : (
          tareas
            .sort((a, b) => {
              const orden = { [EstadoTarea.EN_PROGRESO]: 0, [EstadoTarea.PENDIENTE]: 1, [EstadoTarea.COMPLETADO]: 2 };
              return orden[a.estado] - orden[b.estado] || a.orden - b.orden;
            })
            .map((tarea) => (
              <div
                key={tarea.id}
                className="flex items-center gap-2 p-2 bg-card border rounded-lg"
              >
                {/* Botón izquierda - retroceder estado */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={tarea.estado === EstadoTarea.PENDIENTE}
                  onClick={() => {
                    const prev = tarea.estado === EstadoTarea.COMPLETADO
                      ? EstadoTarea.EN_PROGRESO
                      : EstadoTarea.PENDIENTE;
                    handleEstadoChange(tarea.id, prev);
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Contenido de la tarea */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => handleEdit(tarea)}
                >
                  <div className="flex items-center gap-2">
                    {tarea.estado === EstadoTarea.PENDIENTE && (
                      <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    {tarea.estado === EstadoTarea.EN_PROGRESO && (
                      <Clock className="h-3 w-3 text-primary shrink-0" />
                    )}
                    {tarea.estado === EstadoTarea.COMPLETADO && (
                      <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                    )}
                    <span className={cn(
                      "text-sm font-medium truncate",
                      tarea.estado === EstadoTarea.COMPLETADO && "line-through text-muted-foreground"
                    )}>
                      {tarea.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1 py-0",
                        tarea.prioridad === PrioridadTarea.ALTA && "border-red-300 text-red-700 dark:border-red-800 dark:text-red-400",
                        tarea.prioridad === PrioridadTarea.MEDIA && "border-yellow-300 text-yellow-700 dark:border-yellow-800 dark:text-yellow-400",
                        tarea.prioridad === PrioridadTarea.BAJA && "border-green-300 text-green-700 dark:border-green-800 dark:text-green-400"
                      )}
                    >
                      {tarea.prioridad === PrioridadTarea.ALTA ? 'Alta' : tarea.prioridad === PrioridadTarea.MEDIA ? 'Media' : 'Baja'}
                    </Badge>
                    {tarea.trabajador ? (
                      <Badge variant="secondary" className="gap-1 text-[10px] px-1 py-0">
                        <User className="h-2.5 w-2.5" />
                        {tarea.trabajador.nombre.split(' ')[0]}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-[10px] px-1 py-0 text-muted-foreground">
                        <User className="h-2.5 w-2.5" />
                        Sin asignar
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Menu de opciones */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(tarea)}>
                      <EditIcon className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(tarea.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Botón derecha - avanzar estado */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  disabled={tarea.estado === EstadoTarea.COMPLETADO}
                  onClick={() => {
                    const next = tarea.estado === EstadoTarea.PENDIENTE
                      ? EstadoTarea.EN_PROGRESO
                      : EstadoTarea.COMPLETADO;
                    handleEstadoChange(tarea.id, next);
                  }}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ))
        )}
      </div>

      {/* Desktop: 3 columns */}
      <div className="hidden md:grid md:grid-cols-3 gap-4">
        {columnas.map((col) => (
          <div
            key={col.id}
            className="bg-muted/30 rounded-lg p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const tareaId = e.dataTransfer.getData('tareaId');
              const fromEstado = e.dataTransfer.getData('fromEstado');
              if (fromEstado !== col.id) {
                handleEstadoChange(tareaId, col.id);
              }
            }}
          >
            <KanbanColumn estado={col.id} titulo={col.titulo} />
          </div>
        ))}
      </div>

      {/* Dialog for create/edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTarea ? 'Editar Tarea' : 'Nueva Tarea'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Titulo</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData({ ...formData, titulo: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prioridad">Prioridad</Label>
                <Select
                  value={formData.prioridad}
                  onValueChange={(value: PrioridadTarea) =>
                    setFormData({ ...formData, prioridad: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PrioridadTarea.BAJA}>Baja</SelectItem>
                    <SelectItem value={PrioridadTarea.MEDIA}>Media</SelectItem>
                    <SelectItem value={PrioridadTarea.ALTA}>Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaLimite">Fecha limite</Label>
                <Input
                  id="fechaLimite"
                  type="date"
                  value={formData.fechaLimite}
                  onChange={(e) =>
                    setFormData({ ...formData, fechaLimite: e.target.value })
                  }
                />
              </div>
            </div>
            {trabajadoresAsignados.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="trabajador">Asignar a</Label>
                <Select
                  value={formData.trabajadorId || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, trabajadorId: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {trabajadoresAsignados.map((asig) => (
                      <SelectItem key={asig.trabajadorId} value={asig.trabajadorId}>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {asig.trabajador?.nombre}
                          {asig.trabajador?.cargo && (
                            <span className="text-muted-foreground">- {asig.trabajador.cargo}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
