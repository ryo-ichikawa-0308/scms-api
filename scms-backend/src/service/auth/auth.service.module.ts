import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'src/database/database.module';
import { AccessTokenStrategyModule } from './strategy/access-token.strategy.module';
import { RefreshTokenStrategyModule } from './strategy/refresh-token.strategy.module';
import { ConfigModule } from '@nestjs/config';

/**
 * Authサービスモジュール
 */
@Module({
  imports: [
    DatabaseModule,
    AccessTokenStrategyModule,
    RefreshTokenStrategyModule,
    ConfigModule,
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthServiceModule {}
