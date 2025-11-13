import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesOrchestrator } from './services.orchestrator';
import { ServicesServiceModule } from 'src/service/services/services.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';

@Module({
  imports: [ServicesServiceModule, PrismaModule],
  controllers: [ServicesController],
  providers: [
    ServicesOrchestrator,
    {
      provide: PRISMA_TRANSACTION,
      useFactory: (prismaService: PrismaService) => {
        return prismaService;
      },
      inject: [PrismaService],
    },
  ],
  exports: [],
})
export class ServicesDomainModule {}
