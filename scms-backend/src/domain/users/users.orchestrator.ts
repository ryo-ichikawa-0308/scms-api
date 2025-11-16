import { Injectable, ConflictException, Inject } from '@nestjs/common';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { UsersCreateRequestDto } from './dto/users-create-request.dto';
import { UsersService } from '../../service/users/users.service';
import { randomUUID } from 'crypto';

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

  /**
   * ユーザー登録
   * @param body UsersCreateRequestDto
   * @returns 作成したユーザーのID
   */
  async create(body: UsersCreateRequestDto): Promise<string> {
    // 1. 項目間関連チェック
    const isEmailExists = await this.usersService.isEmailExists(body.email);
    if (isEmailExists) {
      throw new ConflictException('このユーザーは登録できません');
    }

    // 2. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
    const txDateTime = new Date();
    const userId = randomUUID(); // ユーザーIDを新規に発行
    const response = await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        const result = await this.usersService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );
        return result;
      },
    );
    // 3. 登録したリソースのIDを返す
    return response;
  }
}
