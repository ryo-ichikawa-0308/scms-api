import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsOrchestrator } from './contracts.orchestrator';
import { ContractsServiceModule } from '../../service/contracts/contracts.service.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';
import { UserServicesServiceModule } from 'src/service/user-services/user-services.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * Contractsドメインモジュール
 */
@Module({
  imports: [ContractsServiceModule, UserServicesServiceModule, PrismaModule],
  controllers: [ContractsController],
  providers: [
    ContractsOrchestrator,
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
export class ContractsDomainModule {}
