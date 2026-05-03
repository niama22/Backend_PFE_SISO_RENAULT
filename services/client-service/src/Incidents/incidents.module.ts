// incidents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';

import { Incident } from './entities/incident.entity';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';

@Module({
  imports: [
    // 🗄️ Enregistre l'entité Incident dans TypeORM
    TypeOrmModule.forFeature([Incident]),

    // 📁 Configuration globale de Multer pour l'upload des pièces jointes
    MulterModule.register({
      dest: './uploads/incidents',
    }),
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],

  // 🔁 Exporte le service si d'autres modules en ont besoin
  // ex: NotificationsModule, AdminModule
  exports: [IncidentsService],
})
export class IncidentsModule {}
