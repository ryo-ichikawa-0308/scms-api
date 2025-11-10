import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
// import { DatabaseModule } from 'src/database/database.module'; // TODO: DatabaseModuleをインポートし、DAOへの依存を解決

/**
 * Authサービスモジュール
 */
@Module({
  // imports: [DatabaseModule], // Database層のモジュールに依存
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthServiceModule {}
