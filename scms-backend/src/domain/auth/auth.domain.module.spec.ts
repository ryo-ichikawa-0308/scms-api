import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthOrchestrator } from './auth.orchestrator';
import { AuthServiceModule } from '../../service/auth/auth.service.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';
import { PrismaModule } from 'src/prisma/prisma.module';

describe('AuthDomainModule (Module) Test', () => {
  let module: TestingModule;

  // 正常系: モジュールが依存関係を解決し、正しくコンパイルされることをテスト
  it('should compile and resolve all dependencies correctly', async () => {
    // Setup
    module = await Test.createTestingModule({
      imports: [AuthServiceModule, PrismaModule],
      controllers: [AuthController],
      providers: [
        AuthOrchestrator,
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

    expect(module.get(AuthController)).toBeInstanceOf(AuthController);
    expect(module.get(AuthOrchestrator)).toBeInstanceOf(AuthOrchestrator);
  });
});
