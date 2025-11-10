import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthOrchestrator } from './auth.orchestrator';
import { AuthServiceModule } from '../../service/auth/auth.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * Authドメインモジュール
 */
@Module({
  imports: [AuthServiceModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthOrchestrator],
  exports: [AuthOrchestrator],
})
export class AuthDomainModule {}
