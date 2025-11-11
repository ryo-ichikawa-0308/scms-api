import { Injectable, ConflictException, Inject } from '@nestjs/common';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { UsersCreateRequestDto } from './dto/users-create-request.dto';
import { UsersService } from '../../service/users/users.service';

/**
 * Usersのオーケストレーションクラス
 */
@Injectable()
export class UsersOrchestrator {
  constructor(
    private readonly usersService: UsersService,
    @Inject(PRISMA_TRANSACTION)
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  // ユーザー登録 (POST/create)
  /**
   * ユーザー登録
   * @param body UsersCreateRequestDto
   * @returns 作成したユーザーのID
   */
  async create(body: UsersCreateRequestDto): Promise<string> {
    // 登録系Actionのオーケストレーションメソッドのテンプレート
    const txDateTime = new Date();
    const userId = 'USER_CREATE_API'; // 認証を前提としないため、ダミーの登録者IDを渡す

    const response = await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. 項目間関連チェック(Service層のメソッドを呼び出す)
        const isEmailExists = await this.usersService.isEmailExists(body.email);
        if (isEmailExists) {
          throw new ConflictException('このユーザーは登録できません');
        }
        // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
        return await this.usersService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );
      },
    );
    return response;
  }
}
