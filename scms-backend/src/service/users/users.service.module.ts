import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
// import { DatabaseModule } from 'src/database/database.module'; // TODO: DatabaseModuleをインポートし、DAOへの依存を解決

/**
 * Usersサービスモジュール
 */
@Module({
  // imports: [DatabaseModule], // Database層のモジュールに依存
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersServiceModule {}
