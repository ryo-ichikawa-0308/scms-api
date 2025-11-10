import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthOrchestrator } from './auth.orchestrator';
import { AuthServiceModule } from '../../service/auth/auth.service.module'; // Service層のModuleをimport

/**
 * Authドメインモジュール
 */
@Module({
  imports: [AuthServiceModule], // Service層のモジュールに依存
  controllers: [AuthController],
  providers: [
    AuthOrchestrator,
    // TODO: PrismaTransaction型を提供するプロバイダー (PrismaModule/Providerで定義を仮定)
    {
      provide: 'PrismaTransaction', // DIトークン
      useValue: {}, // モックまたはPrismaModuleからの公開インターフェース
    },
  ],
  exports: [AuthOrchestrator],
})
export class AuthDomainModule {}
