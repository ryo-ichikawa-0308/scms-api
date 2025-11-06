import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersDao } from 'src/database/dao/users.dao';
import { ServicesDao } from 'src/database/dao/services.dao';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { ContractsDao } from 'src/database/dao/contracts.dao';

@Module({
  imports: [PrismaModule],
  providers: [UsersDao, ServicesDao, UserServicesDao, ContractsDao],
  exports: [UsersDao, ServicesDao, UserServicesDao, ContractsDao],
})
export class DatabaseModule {}
