import { TestingModule, Test } from '@nestjs/testing';
import { UserServicesServiceModule } from './user-services.service.module';
import { UserServicesService } from './user-services.service';
import { DatabaseModule } from 'src/database/database.module';
import { CommonServiceModule } from '../common/common.service.module';

describe('UserServicesServiceModule (Service Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [UserServicesServiceModule, DatabaseModule, CommonServiceModule],
      providers: [UserServicesService],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(UserServicesService)).toBeInstanceOf(UserServicesService);
  });
});
