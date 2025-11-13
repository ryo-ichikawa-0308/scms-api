import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from 'src/database/database.module';
import { AccessTokenStrategy } from './access-token.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('ACCESS_TOKEN_EXPIRES'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AccessTokenStrategy],
  exports: [JwtModule, AccessTokenStrategy],
})
export class AccessTokenServiceModule {}
