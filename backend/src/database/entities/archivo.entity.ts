import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Obra } from './obra.entity';
import { Tarea } from './tarea.entity';

@Entity('archivos')
export class Archivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column()
  nombreOriginal: string;

  @Column()
  tipo: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  tamanio: number;

  @Column('uuid', { nullable: true })
  obraId: string;

  @Column('uuid', { nullable: true })
  tareaId: string;

  @ManyToOne(() => Obra, (obra) => obra.archivos, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'obraId' })
  obra: Obra;

  @ManyToOne(() => Tarea, (tarea) => tarea.archivos, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tareaId' })
  tarea: Tarea;

  @CreateDateColumn()
  createdAt: Date;
}
