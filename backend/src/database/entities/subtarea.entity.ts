import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tarea } from './tarea.entity';
import { Trabajador } from './trabajador.entity';
import { EstadoTarea } from './enums';

@Entity('subtareas')
export class Subtarea {
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

  @Column('uuid')
  tareaId: string;

  @ManyToOne(() => Tarea, (tarea) => tarea.subtareas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tareaId' })
  tarea: Tarea;

  @Column('uuid', { nullable: true })
  trabajadorId: string;

  @ManyToOne(() => Trabajador, (trabajador) => trabajador.subtareasAsignadas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'trabajadorId' })
  trabajador: Trabajador;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
