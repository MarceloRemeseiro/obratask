import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Trabajador } from './trabajador.entity';
import { TipoAusencia } from './enums';

@Entity('trabajador_ausencias')
export class TrabajadorAusencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: TipoAusencia })
  tipo: TipoAusencia;

  @Column({ type: 'date' })
  fechaInicio: Date;

  @Column({ type: 'date', nullable: true })
  fechaFin: Date;

  @Column({ type: 'text', nullable: true })
  notas: string;

  @Column({ name: 'trabajador_id' })
  trabajadorId: string;

  @ManyToOne(() => Trabajador, (trabajador) => trabajador.ausencias, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'trabajador_id' })
  trabajador: Trabajador;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
