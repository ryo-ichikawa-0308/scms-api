import { Test, TestingModule } from '@nestjs/testing';
import { ContractsController } from './contracts.controller';
import { ContractsOrchestrator } from './contracts.orchestrator';
import { ContractsServiceModule } from '../../service/contracts/contracts.service.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';
import { UserServicesServiceModule } from 'src/service/user-services/user-services.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';

describe('ContractsDomainModule (Module) Test', () => {
  let module: TestingModule;

  it('正常にコンパイルできること', async () => {
    module = await Test.createTestingModule({
      imports: [
        ContractsServiceModule,
        UserServicesServiceModule,
        PrismaModule,
      ],
      controllers: [ContractsController],
      providers: [
        ContractsOrchestrator,
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

    expect(module.get(ContractsController)).toBeInstanceOf(ContractsController);
    expect(module.get(ContractsOrchestrator)).toBeInstanceOf(
      ContractsOrchestrator,
    );
  });
});
