import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Obra } from './obra.entity';
import { Subtarea } from './subtarea.entity';
import { Archivo } from './archivo.entity';
import { Trabajador } from './trabajador.entity';
import { EstadoTarea, PrioridadTarea } from './enums';

export { EstadoTarea, PrioridadTarea } from './enums';

@Entity('tareas')
export class Tarea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({
    type: 'enum',
    enum: EstadoTarea,
    default: EstadoTarea.PENDIENTE,
  })
  estado: EstadoTarea;

  @Column({
    type: 'enum',
    enum: PrioridadTarea,
    default: PrioridadTarea.MEDIA,
  })
  prioridad: PrioridadTarea;

  @Column({ default: 0 })
  orden: number;

  @Column({ type: 'date', nullable: true })
  fechaLimite: Date;

  @Column('uuid')
  obraId: string;

  @Column('uuid', { nullable: true })
  trabajadorId: string | null;

  @ManyToOne(() => Obra, (obra) => obra.tareas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obraId' })
  obra: Obra;

  @ManyToOne(() => Trabajador, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trabajadorId' })
  trabajador: Trabajador;

  @OneToMany(() => Subtarea, (subtarea) => subtarea.tarea)
  subtareas: Subtarea[];

  @OneToMany(() => Archivo, (archivo) => archivo.tarea)
  archivos: Archivo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
