import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { UserServicesCreateRequestDto } from './dto/user-services-create-request.dto';
import { UserServicesService } from 'src/service/user-services/user-services.service';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';

/**
 * UserServicesのオーケストレーションクラス
 */
@Injectable()
export class UserServicesOrchestrator {
  constructor(
    private readonly userServicesService: UserServicesService,
    @Inject(PRISMA_TRANSACTION)
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  // 登録系Actionのオーケストレーションメソッド
  /**
   * ユーザー提供サービス登録
   * @param body UserServicesCreateRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns 登録したリソースのID
   */
  async create(
    body: UserServicesCreateRequestDto,
    userId: string,
  ): Promise<string> {
    const txDateTime = new Date();
    const result = await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
        const isUserServiceExists =
          await this.userServicesService.isUserServiceExists(
            body.userID,
            body.serviceID,
          );
        if (isUserServiceExists) {
          throw new ConflictException(
            'このユーザー提供サービスは登録できません',
          );
        }
        // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, 各種dtoを渡す
        const response = await this.userServicesService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );
        // 3. 登録したリソースのIDを返す
        return response;
      },
    );
    return result;
  }
}
