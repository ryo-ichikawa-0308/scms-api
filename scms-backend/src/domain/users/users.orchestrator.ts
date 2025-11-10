import { Injectable, Inject } from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type'; // Assumed type

import { UsersCreateRequestDto } from './dto/users-create-request.dto';
import { UsersCreateResponseDto } from './dto/users-create-response.dto';
import { UsersService } from '../../service/users/users.service';

/**
 * Usersのオーケストレーションクラス
 */
@Injectable()
export class UsersOrchestrator {
  constructor(
    private readonly usersService: UsersService,
    // PrismaServiceから $transaction のみ公開するインターフェースをDI
    @Inject('PrismaTransaction')
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  // ユーザー登録 (POST/create)
  /**
   * ユーザー登録
   * @param body UsersCreateRequestDto
   * @returns UsersCreateResponseDto
   */
  async create(body: UsersCreateRequestDto): Promise<UsersCreateResponseDto> {
    // 登録系Actionのオーケストレーションメソッドのテンプレート
    const txDateTime = new Date();
    const userId = 'GUEST_USER'; // 認証を前提としないため、仮のユーザーID

    await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. TODO: 項目間関連チェック(Service層のメソッドを呼び出す)
        // 2. TODO: Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
        await this.usersService.createWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );
      },
    );

    return {}; // 204 No Content
  }
}
