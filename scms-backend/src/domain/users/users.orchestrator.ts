import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { PrismaTransaction } from 'src/prisma/prisma.type';
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
