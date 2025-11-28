import { Module } from '@nestjs/common';
import { InitBatchService } from './init.batch.service';
import { UsersDomainModule } from 'src/domain/users/users.domain.module';
import { ServicesDomainModule } from 'src/domain/services/services.domain.module';
import { UserServicesDomainModule } from 'src/domain/user-services/user-services.domain.module';

@Module({
  imports: [UsersDomainModule, ServicesDomainModule, UserServicesDomainModule],
  providers: [InitBatchService],
  exports: [InitBatchService],
})
export class InitBatchModule {}
