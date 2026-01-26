import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { Obra } from './database/entities/obra.entity';
import { Tarea } from './database/entities/tarea.entity';
import { Subtarea } from './database/entities/subtarea.entity';
import { Trabajador } from './database/entities/trabajador.entity';
import { TrabajadorAusencia } from './database/entities/trabajador-ausencia.entity';
import { ObraTrabajador } from './database/entities/obra-trabajador.entity';
import { Archivo } from './database/entities/archivo.entity';

import { TrabajadoresModule } from './trabajadores/trabajadores.module';
import { ObrasModule } from './obras/obras.module';
import { TareasModule } from './tareas/tareas.module';
import { SubtareasModule } from './subtareas/subtareas.module';
import { ArchivosModule } from './archivos/archivos.module';
import { RevisionModule } from './revision/revision.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: +configService.get('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [Obra, Tarea, Subtarea, Trabajador, TrabajadorAusencia, ObraTrabajador, Archivo],
        synchronize: true, // Solo para desarrollo
      }),
      inject: [ConfigService],
    }),
    TrabajadoresModule,
    ObrasModule,
    TareasModule,
    SubtareasModule,
    ArchivosModule,
    RevisionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
