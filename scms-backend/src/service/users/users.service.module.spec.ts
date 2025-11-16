import { TestingModule, Test } from '@nestjs/testing';
import { UsersServiceModule } from './users.service.module';
import { UsersService } from './users.service';
import { DatabaseModule } from 'src/database/database.module';
import { AuthServiceModule } from '../auth/auth.service.module';

describe('UsersServiceModule (Service Module) Test', () => {
  let module: TestingModule;
  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [UsersServiceModule, DatabaseModule, AuthServiceModule],
    }).compile();
    expect(module).toBeDefined();
    expect(module.get(UsersService)).toBeInstanceOf(UsersService);
  });
});
