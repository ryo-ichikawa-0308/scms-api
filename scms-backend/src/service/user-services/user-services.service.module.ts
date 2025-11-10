import { Module } from '@nestjs/common';
import { UserServicesService } from './user-services.service';
// import { DatabaseModule } from 'src/database/database.module'; // TODO: DatabaseModuleをインポートし、DAOへの依存を解決

/**
 * UserServicesサービスモジュール
 */
@Module({
  // imports: [DatabaseModule],
  providers: [UserServicesService],
  exports: [UserServicesService],
})
export class UserServicesServiceModule {}
