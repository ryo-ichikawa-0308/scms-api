import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      // データベース操作のロギングを有効にする
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
    });
    this.enableShutdownHooks();
  }

  /**
   * データベース接続を確立する
   */
  async onModuleInit() {
    try {
      await this.$connect();
      console.log(
        'PrismaService initialized and connected to the database successfully.',
      );
    } catch (error) {
      console.error(
        'Failed to connect to the database on initialization:',
        error,
      );
      process.exit(1);
    }
  }

  /**
   * データベース接続を切断する
   */
  async onModuleDestroy() {
    await this.$disconnect();
    console.log('PrismaService disconnected from the database.');
  }

  /**
   * Node.jsプロセス終了時にDB接続を安全に切断する
   */
  private enableShutdownHooks(): void {
    const shutdown = async (signal: string) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      try {
        await this.$disconnect();
        console.log('Prisma client successfully disconnected.');
      } catch (error) {
        console.error('Error during Prisma disconnect:', error);
      } finally {
        // クリーンアップ後、プロセスを終了
        process.exit(0);
      }
    };

    // Ctrl+Cを検出してシャットダウンする
    process.on('SIGINT', () => {
      shutdown('SIGINT').catch((err) => {
        console.error('Fatal error during SIGINT shutdown:', err);
        process.exit(1);
      });
    });

    // Dockerからの終了シグナルを検出してシャットダウンする
    process.on('SIGTERM', () => {
      shutdown('SIGTERM').catch((err) => {
        console.error('Fatal error during SIGTERM shutdown:', err);
        process.exit(1);
      });
    });
  }
}
