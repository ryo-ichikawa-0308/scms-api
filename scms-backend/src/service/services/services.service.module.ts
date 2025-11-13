import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesServiceModule {}
