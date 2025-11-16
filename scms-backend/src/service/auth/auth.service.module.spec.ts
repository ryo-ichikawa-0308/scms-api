import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AccessTokenStrategyModule } from './strategy/access-token.strategy.module';
import { RefreshTokenStrategyModule } from './strategy/refresh-token.strategy.module';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from 'src/database/database.module';

describe('AuthServiceModule (Service Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [
        DatabaseModule,
        AccessTokenStrategyModule,
        RefreshTokenStrategyModule,
        ConfigModule,
      ],
      providers: [AuthService],
      exports: [AuthService],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(AuthService)).toBeInstanceOf(AuthService);
  });
});
