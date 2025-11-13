import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'src/database/database.module';
import { AccessTokenServiceModule } from './access-token.strategy.module';
import { RefreshTokenServiceModule } from './refresh-token.strategy.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Authサービスモジュール
 */
@Module({
  imports: [
    DatabaseModule,
    AccessTokenServiceModule,
    RefreshTokenServiceModule,
    ConfigModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthServiceModule {}
