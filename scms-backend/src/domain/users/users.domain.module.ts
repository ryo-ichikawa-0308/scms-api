import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersOrchestrator } from './users.orchestrator';
import { UsersServiceModule } from '../../service/users/users.service.module'; // Service層のModuleをimport
import { PrismaService } from 'src/prisma/prisma.service';
import { PRISMA_TRANSACTION } from 'src/prisma/prisma.type';
import { AuthServiceModule } from 'src/service/auth/auth.service.module';
import { PrismaModule } from 'src/prisma/prisma.module';

/**
 * Usersドメインモジュール
 */
@Module({
  imports: [UsersServiceModule, AuthServiceModule, PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersOrchestrator,
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
export class UsersDomainModule {}
