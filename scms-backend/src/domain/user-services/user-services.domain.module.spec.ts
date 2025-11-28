import { Test, TestingModule } from '@nestjs/testing';
import { UserServicesController } from './user-services.controller';
import { UserServicesOrchestrator } from './user-services.orchestrator';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UserServicesServiceModule } from 'src/service/user-services/user-services.service.module';

describe('UserServicesDomainModule (Domain Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [UserServicesServiceModule, PrismaModule],
      controllers: [UserServicesController],
      providers: [
        UserServicesOrchestrator,
        {
          provide: PRISMA_TRANSACTION,
          useFactory: (prismaService: PrismaService) => {
            return prismaService;
          },
          inject: [PrismaService],
        },
      ],
      exports: [UserServicesOrchestrator],
    })
      .overrideProvider('PrismaTransaction')
      .useValue({ $transaction: jest.fn() })
      .compile();
    expect(module).toBeDefined();
    expect(module.get(UserServicesController)).toBeInstanceOf(
      UserServicesController,
    );
    expect(module.get(UserServicesOrchestrator)).toBeInstanceOf(
      UserServicesOrchestrator,
    );
  });
});
