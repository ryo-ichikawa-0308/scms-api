import { Module } from '@nestjs/common';
import { UserServicesService } from './user-services.service';
import { DatabaseModule } from 'src/database/database.module';
import { CommonServiceModule } from '../common/common.service.module';
/**
 * UserServicesサービスモジュール
 */
@Module({
  imports: [DatabaseModule, CommonServiceModule],
  providers: [UserServicesService],
  exports: [UserServicesService],
})
export class UserServicesServiceModule {}
