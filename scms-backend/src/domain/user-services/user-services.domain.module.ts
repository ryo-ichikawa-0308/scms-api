import { Module } from '@nestjs/common';
import { UserServicesController } from './user-services.controller';
import { UserServicesServiceModule } from '../../service/user-services/user-services.service.module';

/**
 * UserServicesドメインモジュール
 */
@Module({
  imports: [UserServicesServiceModule],
  controllers: [UserServicesController],
  providers: [],
  exports: [],
})
export class UserServicesDomainModule {}
