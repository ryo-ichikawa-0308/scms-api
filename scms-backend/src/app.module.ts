import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersDomainModule } from './domain/users/users.domain.module';
import { AuthDomainModule } from './domain/auth/auth.domain.module';
import { ContractsDomainModule } from './domain/contracts/contracts.domain.module';
import { UserServicesDomainModule } from './domain/user-services/user-services.domain.module';
import { ServicesDomainModule } from './domain/services/services.domain.module';
@Module({
  imports: [
    AuthDomainModule,
    UsersDomainModule,
    ContractsDomainModule,
    UserServicesDomainModule,
    ServicesDomainModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
