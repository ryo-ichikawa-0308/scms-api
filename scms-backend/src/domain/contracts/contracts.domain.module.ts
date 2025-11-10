import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsOrchestrator } from './contracts.orchestrator';
import { ContractsServiceModule } from '../../service/contracts/contracts.service.module';

/**
 * Contractsドメインモジュール
 */
@Module({
  imports: [ContractsServiceModule],
  controllers: [ContractsController],
  providers: [
    ContractsOrchestrator,
    // TODO: PrismaTransaction型を提供するプロバイダー
    {
      provide: 'PrismaTransaction',
      useValue: {},
    },
  ],
  exports: [ContractsOrchestrator],
})
export class ContractsDomainModule {}
