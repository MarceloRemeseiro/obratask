import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tarea } from './tarea.entity';
import { AutorComentario } from './enums';

@Entity('tarea_comentarios')
export class TareaComentario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  texto: string;

  @Column({
    type: 'enum',
    enum: AutorComentario,
  })
  autor: AutorComentario;

  @Column()
  autorNombre: string;

  @Column('uuid')
  tareaId: string;

  @ManyToOne(() => Tarea, (tarea) => tarea.comentarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tareaId' })
  tarea: Tarea;

  @Column({ default: false })
  leidoPorAdmin: boolean;

  @Column({ default: false })
  leidoPorEncargado: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
