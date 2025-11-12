import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/database/database.module';
import { RefreshTokenStrategy } from './refresh-token.strategy';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt-refresh' }),
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY_FROM_ENV', // TODO: あとで環境変数取得に変更
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [RefreshTokenStrategy],
  exports: [JwtModule, RefreshTokenStrategy],
})
export class RefreshTokenServiceModule {}
