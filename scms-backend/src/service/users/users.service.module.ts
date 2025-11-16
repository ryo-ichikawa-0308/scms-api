import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuthServiceModule } from '../auth/auth.service.module';
/**
 * Usersサービスモジュール
 */
@Module({
  imports: [DatabaseModule, AuthServiceModule],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersServiceModule {}
