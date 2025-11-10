import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersOrchestrator } from './users.orchestrator';
import { UsersServiceModule } from '../../service/users/users.service.module'; // Service層のModuleをimport

/**
 * Usersドメインモジュール
 */
@Module({
  imports: [UsersServiceModule], // Service層のモジュールに依存
  controllers: [UsersController],
  providers: [
    UsersOrchestrator,
    // TODO: PrismaTransaction型を提供するプロバイダー
    {
      provide: 'PrismaTransaction',
      useValue: {},
    },
  ],
  exports: [UsersOrchestrator],
})
export class UsersDomainModule {}
