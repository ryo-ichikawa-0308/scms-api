import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

describe('AccessTokenServiceModule (Service Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
            signOptions: {
              expiresIn: configService.getOrThrow<number>(
                'ACCESS_TOKEN_EXPIRES',
              ),
            },
          }),
          inject: [ConfigService],
        }),
        ConfigModule,
      ],
      providers: [RefreshTokenStrategy],
      exports: [JwtModule, RefreshTokenStrategy],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(JwtModule)).toBeInstanceOf(JwtModule);
    expect(module.get(RefreshTokenStrategy)).toBeInstanceOf(
      RefreshTokenStrategy,
    );
  });
});
