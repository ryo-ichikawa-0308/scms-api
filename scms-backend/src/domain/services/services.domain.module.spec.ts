import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesOrchestrator } from './services.orchestrator';
import { ServicesServiceModule } from 'src/service/services/services.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';

describe('ServicesDomainModule (Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [ServicesServiceModule, PrismaModule],
      controllers: [ServicesController],
      providers: [
        ServicesOrchestrator,
        {
          provide: PRISMA_TRANSACTION,
          useFactory: (prismaService: PrismaService) => {
            return prismaService;
          },
          inject: [PrismaService],
        },
      ],
      exports: [],
    }).compile();

    expect(module.get(ServicesController)).toBeInstanceOf(ServicesController);
    expect(module.get(ServicesOrchestrator)).toBeInstanceOf(
      ServicesOrchestrator,
    );
  });
});
