import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';
// import { UsersDao } from 'src/database/users.dao'; // Assumed DAO

import { UsersCreateRequestDto } from '../../domain/users/dto/users-create-request.dto';
import { UsersCreateResponseDto } from '../../domain/users/dto/users-create-response.dto';
// import { CreateUsersDto } from 'src/database/users.dto'; // Assumed DB DTO

/**
 * ユーザーに関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class UsersService {
  // constructor(
  //   private readonly usersDao: UsersDao, // ユーザーDAOに依存
  // ) {}

  // ユーザー登録 (POST/create) - トランザクション対応メソッド
  /**
   * ユーザー登録 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body UsersCreateRequestDto
   * @returns UsersCreateResponseDto
   */
  async createWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: UsersCreateRequestDto,
  ): Promise<UsersCreateResponseDto> {
    // 1. TODO: RequestDtoからDB登録データ (DAO) へ詰め替え (RequestDto -> CreateUsersDto)
    // Note: パスワードはここでハッシュ化を行う
    // const createDto: CreateUsersDto = { ... };

    // 2. TODO: ビジネスロジックの実行 (バリデーション、採番、属性付与など)
    // 3. TODO: DAOのtx対応メソッドを呼び出し、DB登録を実行 (prismaTxを渡す)
    // const createdUser = await this.usersDao.createUsers(prismaTx, createDto);

    // 4. TODO: 登録成功。空のDTOを返却
    return {};
  }
}
