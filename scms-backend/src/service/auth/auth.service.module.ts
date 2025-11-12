import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'src/database/database.module';
import { AccessTokenServiceModule } from './access-token.strategy.module';
import { RefreshTokenServiceModule } from './refresh-token.strategy.module';

/**
 * Authサービスモジュール
 */
@Module({
  imports: [
    DatabaseModule,
    AccessTokenServiceModule,
    RefreshTokenServiceModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthServiceModule {}
