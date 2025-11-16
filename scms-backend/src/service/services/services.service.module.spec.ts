import { TestingModule, Test } from '@nestjs/testing';
import { ServicesService } from './services.service';
import { DatabaseModule } from 'src/database/database.module';

describe('ServicesServiceModule (Service Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [DatabaseModule],
      providers: [ServicesService],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(ServicesService)).toBeInstanceOf(ServicesService);
  });
});
