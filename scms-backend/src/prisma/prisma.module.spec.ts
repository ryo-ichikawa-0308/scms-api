import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaModule (Prisma Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [],
      providers: [PrismaService],
      exports: [PrismaService],
    }).compile();
    expect(module).toBeDefined();
    const prismaService = module.get(PrismaService);
    expect(prismaService).toBeDefined();
  });
});
