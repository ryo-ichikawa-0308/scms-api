import { TestingModule, Test } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { DatabaseModule } from 'src/database/database.module';
import { CommonServiceModule } from '../common/common.service.module';

describe('ContractsServiceModule (Service Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule, CommonServiceModule],
      providers: [ContractsService],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(ContractsService)).toBeInstanceOf(ContractsService);
  });
});
