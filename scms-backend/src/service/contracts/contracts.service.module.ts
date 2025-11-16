import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { DatabaseModule } from 'src/database/database.module';
import { CommonServiceModule } from '../common/common.service.module';

/**
 * Contractsサービスモジュール
 */
@Module({
  imports: [DatabaseModule, CommonServiceModule],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsServiceModule {}
