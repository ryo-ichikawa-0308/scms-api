import { Module } from '@nestjs/common';
import { UserServicesController } from './user-services.controller';
import { UserServicesServiceModule } from '../../service/user-services/user-services.service.module';
import { UserServicesOrchestrator } from './user-services.orchestrator';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * UserServicesドメインモジュール
 */
@Module({
  imports: [UserServicesServiceModule, PrismaModule],
  controllers: [UserServicesController],
  providers: [
    UserServicesOrchestrator,
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
export class UserServicesDomainModule {}
