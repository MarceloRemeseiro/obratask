import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Obra } from './obra.entity';
import { Trabajador } from './trabajador.entity';

@Entity('obras_trabajadores')
export class ObraTrabajador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  obraId: string;

  @Column('uuid')
  trabajadorId: string;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ type: 'boolean', default: false })
  pendienteConfirmacion: boolean;

  @ManyToOne(() => Obra, (obra) => obra.obrasTrabajador, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'obraId' })
  obra: Obra;

  @ManyToOne(() => Trabajador, (trabajador) => trabajador.obrasTrabajador, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trabajadorId' })
  trabajador: Trabajador;

  @CreateDateColumn()
  createdAt: Date;
}
