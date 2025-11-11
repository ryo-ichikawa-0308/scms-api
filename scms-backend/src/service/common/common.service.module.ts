import { Module } from '@nestjs/common';
import { CommonService } from './common.service';

/**
 * 共通サービスモジュール
 */
@Module({
  providers: [CommonService],
  exports: [CommonService],
})
export class CommonServiceModule {}
