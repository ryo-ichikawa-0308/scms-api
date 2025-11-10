import { Module } from '@nestjs/common';
import { UserServicesController } from './user-services.controller';
import { UserServicesServiceModule } from '../../service/user-services/user-services.service.module'; // Service層のModuleをimport

/**
 * UserServicesドメインモジュール
 */
@Module({
  imports: [UserServicesServiceModule],
  controllers: [UserServicesController],
  providers: [
    // Note: Orchestratorがない
  ],
  exports: [],
})
export class UserServicesDomainModule {}
