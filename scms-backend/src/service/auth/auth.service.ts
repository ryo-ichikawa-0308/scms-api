import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type'; // Assumed type
// Assuming DAO classes are available from the service module's providers/imports
// import { UsersDao } from 'src/database/users.dao'; // Assumed DAO

import { AuthLoginRequestDto } from '../../domain/auth/dto/auth-login-request.dto';
import { AuthLoginResponseDto } from '../../domain/auth/dto/auth-login-response.dto';
// import { UpdateUsersDto } from 'src/database/users.dto'; // Assumed DB DTO

/**
 * 認証に関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class AuthService {
  // constructor(
  //   private readonly usersDao: UsersDao, // ユーザーDAOに依存
  // ) {}

  // ログイン (POST/login) - トランザクション対応メソッド
  /**
   * ログイン処理 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body AuthLoginRequestDto
   * @returns AuthLoginResponseDto
   */
  async loginWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    // 1. TODO: 認証処理の実行 (メールアドレス/パスワード照合)
    // 2. TODO: 認証成功後、JWTトークンを生成
    const generatedToken = 'MOCK_JWT_TOKEN'; // TODO: トークン生成
    const currentUserId = 'ACTUAL_USER_ID_FROM_DB'; // TODO: DBから取得したユーザーID
    const userName = 'ACTUAL_USER_NAME_FROM_DB'; // TODO: DBから取得したユーザー名

    // 3. TODO: ユーザーテーブルのトークンを更新 (this.usersDao.updateUsers(prismaTx, updateDto))
    // 4. TODO: DB結果を ResponseDto へ詰め替え
    return {
      token: generatedToken,
      id: currentUserId,
      name: userName,
    } as AuthLoginResponseDto;
  }

  // ログアウト (POST/logout) - トランザクション対応メソッド
  /**
   * ログアウト処理 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body AuthLogoutRequestDto
   * @returns AuthLogoutResponseDto
   */
  async logoutWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: AuthLogoutRequestDto,
  ): Promise<AuthLogoutResponseDto> {
    // 1. TODO: ユーザーテーブルのトークンをNULLに更新 (this.usersDao.updateUsers(prismaTx, updateDto))
    // 2. TODO: ログアウト成功。空のDTOを返却
    return {};
  }
}
