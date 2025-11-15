import { Test, TestingModule } from '@nestjs/testing';
import { UsersDomainModule } from './users.domain.module';
import { UsersController } from './users.controller';
import { UsersOrchestrator } from './users.orchestrator';
import { UsersServiceModule } from 'src/service/users/users.service.module';

describe('UsersDomainModule (Domain Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [UsersDomainModule, UsersServiceModule],
    })
      .overrideProvider('PrismaTransaction')
      .useValue({ $transaction: jest.fn() })
      .compile();
    expect(module).toBeDefined();
    expect(module.get(UsersController)).toBeInstanceOf(UsersController);
    expect(module.get(UsersOrchestrator)).toBeInstanceOf(UsersOrchestrator);
  });
});
