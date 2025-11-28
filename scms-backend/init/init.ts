import { NestFactory } from '@nestjs/core';
import { InitBatchModule } from './init.batch.module';
import { InitBatchService } from './init.batch.service';

// 初期データ投入バッチのエントリポイント
async function bootstrap() {
  const appContext =
    await NestFactory.createApplicationContext(InitBatchModule);

  try {
    const initBatchService = appContext.get(InitBatchService);
    await initBatchService.initializeData();
  } catch (error) {
    console.error('バッチ実行中に致命的なエラーが発生しました。', error);
    process.exit(1);
  } finally {
    await appContext.close();
    process.exit(0);
  }
}

bootstrap().catch((err) => {
  console.error('バッチ実行中にエラーが発生しました:', err);
  process.exit(1);
});
