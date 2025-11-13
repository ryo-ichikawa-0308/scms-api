import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/database/database.module';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt-refresh' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('REFRESH_TOKEN_EXPIRES'),
        },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
  ],
  providers: [RefreshTokenStrategy],
  exports: [JwtModule, RefreshTokenStrategy],
})
export class RefreshTokenServiceModule {}
