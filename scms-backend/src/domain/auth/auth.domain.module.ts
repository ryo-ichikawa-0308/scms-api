import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthOrchestrator } from './auth.orchestrator';
import { AuthServiceModule } from '../../service/auth/auth.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';

/**
 * Authドメインモジュール
 */
@Module({
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
})
export class AuthDomainModule {}
