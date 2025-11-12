import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/database/database.module';
import { AccessTokenStrategy } from './access-token.strategy';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: 'YOUR_SECRET_KEY_FROM_ENV', // TODO: あとで環境変数取得に変更
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [AccessTokenStrategy],
  exports: [JwtModule, AccessTokenStrategy],
})
export class AccessTokenServiceModule {}
