import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ObraTrabajador } from './obra-trabajador.entity';
import { Subtarea } from './subtarea.entity';
import { TrabajadorAusencia } from './trabajador-ausencia.entity';
import { TipoContrato, TipoCarnet } from './enums';

@Entity('trabajadores')
export class Trabajador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ nullable: true })
  cargo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ nullable: true })
  telefono: string;

  @Column({ nullable: true })
  email: string;

  // Contrato
  @Column({ type: 'enum', enum: TipoContrato, nullable: true })
  tipoContrato: TipoContrato;

  @Column({ type: 'date', nullable: true })
  fechaInicioContrato: Date;

  @Column({ type: 'date', nullable: true })
  fechaFinContrato: Date;

  // Vacaciones
  @Column({ type: 'int', default: 22 })
  diasVacacionesAnuales: number;

  // Especialidades (JSON array)
  @Column({ type: 'simple-array', nullable: true })
  especialidades: string[];

  // Carnet de conducir
  @Column({ type: 'enum', enum: TipoCarnet, nullable: true })
  carnetConducir: TipoCarnet;

  @Column({ type: 'date', nullable: true })
  carnetConducirVencimiento: Date;

  // Documentación con vencimiento
  @Column({ type: 'date', nullable: true })
  reconocimientoMedicoVencimiento: Date;

  @Column({ type: 'date', nullable: true })
  formacionPRLVencimiento: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => ObraTrabajador, (ot) => ot.trabajador)
  obrasTrabajador: ObraTrabajador[];

  @OneToMany(() => Subtarea, (subtarea) => subtarea.trabajador)
  subtareasAsignadas: Subtarea[];

  @OneToMany(() => TrabajadorAusencia, (ausencia) => ausencia.trabajador)
  ausencias: TrabajadorAusencia[];
}
