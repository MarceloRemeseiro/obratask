import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Tarea } from './tarea.entity';
import { ObraTrabajador } from './obra-trabajador.entity';
import { Archivo } from './archivo.entity';
import { EstadoObra } from './enums';

export { EstadoObra } from './enums';

@Entity('obras')
export class Obra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ type: 'date', nullable: true })
  fechaInicioPrev: Date;

  @Column({ type: 'date', nullable: true })
  fechaFinPrev: Date;

  @Column({ type: 'date', nullable: true })
  fechaInicioReal: Date;

  @Column({ type: 'date', nullable: true })
  fechaFinReal: Date;

  @Column({
    type: 'enum',
    enum: EstadoObra,
    default: EstadoObra.SIN_INICIAR,
  })
  estado: EstadoObra;

  @Column({ default: false })
  cerradaManualmente: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Tarea, (tarea) => tarea.obra)
  tareas: Tarea[];

  @OneToMany(() => ObraTrabajador, (ot) => ot.obra)
  obrasTrabajador: ObraTrabajador[];

  @OneToMany(() => Archivo, (archivo) => archivo.obra)
  archivos: Archivo[];
}
