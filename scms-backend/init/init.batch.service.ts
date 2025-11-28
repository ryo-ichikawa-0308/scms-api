import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { UsersOrchestrator } from 'src/domain/users/users.orchestrator';
import { ServicesOrchestrator } from 'src/domain/services/services.orchestrator';
import { UserServicesOrchestrator } from 'src/domain/user-services/user-services.orchestrator';

import { UsersCreateRequestDto } from 'src/domain/users/dto/users-create-request.dto';
import { ServicesCreateRequestDto } from 'src/domain/services/dto/services-create-request.dto';
import { UserServicesCreateRequestDto } from 'src/domain/user-services/dto/user-services-create-request.dto';

import { USERS_INIT_DATA } from './data/users';
import { SERVICES_INIT_DATA } from './data/services';

interface UserData {
  name: string;
  email: string;
  password?: string;
}

interface ServiceItem {
  name: string;
  description: string;
  price: number;
  unit: string;
}

interface ServicesData {
  [userName: string]: ServiceItem[];
}

// Simple contract management system 初期データ登録バッチ
@Injectable()
export class InitBatchService {
  private readonly logger = new Logger(InitBatchService.name);

  constructor(
    private readonly usersOrchestrator: UsersOrchestrator,
    private readonly servicesOrchestrator: ServicesOrchestrator,
    private readonly userServicesOrchestrator: UserServicesOrchestrator,
  ) {}

  /**
   * 在庫数生成: 10から100までのランダムな整数を生成する
   */
  private getRandomStock(): number {
    return Math.floor(Math.random() * (100 - 10 + 1)) + 10;
  }

  /**
   * 初期データを登録するバッチ処理のメイン関数
   */
  async initializeData(): Promise<void> {
    this.logger.log('--- 初期データ登録バッチ処理開始 ---');

    try {
      // 1. users.jsonの読み込み
      const users: UserData[] = USERS_INIT_DATA;
      this.logger.log(`ユーザーデータ ${users.length} 件を読み込みました。`);

      // 2. services.jsonの読み込み
      const allServicesData: ServicesData = SERVICES_INIT_DATA;
      this.logger.log(`サービスデータ（グループ化）を読み込みました。`);

      // 3. ユーザーの登録とサービスへの紐付け処理
      for (const user of users) {
        this.logger.log(`\n▶ ユーザーの処理: ${user.name} (${user.email})`);
        const usersDto = {
          name: user.name,
          email: user.email,
          password: user.password,
        } as UsersCreateRequestDto;

        // 3-1. usersOrchestrator.createメソッドを起動
        const createdUseId = await this.usersOrchestrator.create(usersDto);
        this.logger.log(`   - ユーザー登録完了 (userId: ${createdUseId})`);

        // 3-2. services.jsonから該当ユーザーのサービスを取得
        const userServices = allServicesData[user.name] || [];
        this.logger.log(
          `   - このユーザーに紐づくサービス ${userServices.length} 件`,
        );

        if (userServices.length === 0) {
          this.logger.warn(
            `   - サービスデータがservices.jsonのキー [${user.name}] に見つかりませんでした。スキップします。`,
          );
          continue;
        }

        // 3-3. サービスの登録とuser_servicesへの紐付け
        for (const service of userServices) {
          // servicesOrchestrator.createメソッドを起動
          const serviceDto = {
            name: service.name,
            description: service.description,
            price: service.price,
            unit: service.unit,
          } as ServicesCreateRequestDto;
          const createdServiceId = await this.servicesOrchestrator.create(
            serviceDto,
            createdUseId,
          );

          // userServicesOrchestrator.createメソッドを起動
          const stock = this.getRandomStock();
          const userServicesDto = {
            userId: createdUseId,
            serviceId: createdServiceId,
            stock: stock,
          } as UserServicesCreateRequestDto;
          await this.userServicesOrchestrator.create(
            userServicesDto,
            createdUseId,
          );
          this.logger.log(
            `   - サービス「${service.name}」登録、在庫 ${stock} で紐付け完了。`,
          );
        }
      }

      this.logger.log('\n--- 初期データ登録バッチ処理完了（成功）---');
    } catch (error) {
      if (error instanceof ConflictException) {
        this.logger.warn(
          '\n--- 重複データが発見されました。初期データ登録済みと判断し、データ登録をスキップします。 ---',
        );
        return;
      }
      this.logger.error('\n--- 初期データ登録バッチ処理エラー ---');
      this.logger.error(error);
      throw error;
    }
  }
}
