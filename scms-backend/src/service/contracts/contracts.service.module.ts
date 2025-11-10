import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
// import { DatabaseModule } from 'src/database/database.module';

/**
 * Contractsサービスモジュール
 */
@Module({
  // imports: [DatabaseModule],
  providers: [ContractsService],
  exports: [ContractsService],
})
export class ContractsServiceModule {}
