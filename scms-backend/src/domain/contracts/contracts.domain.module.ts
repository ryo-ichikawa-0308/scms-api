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
  providers: [ContractsOrchestrator],
  exports: [ContractsOrchestrator],
})
export class ContractsDomainModule {}
