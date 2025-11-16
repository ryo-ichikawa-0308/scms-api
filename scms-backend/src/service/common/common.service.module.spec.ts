import { TestingModule, Test } from '@nestjs/testing';
import { CommonService } from './common.service';

describe('CommonServiceModule (Service Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      providers: [CommonService],
      exports: [CommonService],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(CommonService)).toBeInstanceOf(CommonService);
  });
});
