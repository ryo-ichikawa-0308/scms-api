import { Injectable, Inject } from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type'; // Assumed type

import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthLogoutRequestDto } from './dto/auth-logout-request.dto';
import { AuthLogoutResponseDto } from './dto/auth-logout-response.dto';
import { AuthService } from '../../service/auth/auth.service';

/**
 * Authのオーケストレーションクラス
 */
@Injectable()
export class AuthOrchestrator {
  constructor(
    private readonly authService: AuthService,
    // PrismaServiceから $transaction のみ公開するインターフェースをDI
    @Inject('PrismaTransaction')
    private readonly prismaTransaction: PrismaTransaction,
  ) {}

  // ログイン (POST/login)
  /**
   * ログイン
   * @param body AuthLoginRequestDto
   * @returns AuthLoginResponseDto
   */
  async login(body: AuthLoginRequestDto): Promise<AuthLoginResponseDto> {
    // ログインは認証(Service)とトークン更新(DB write)を含むため、Orchestratorでトランザクション管理を行う
    return this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. TODO: 項目間関連チェック(Service層のメソッドを呼び出す)
        const txDateTime = new Date();
        // 2. TODO: Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
        const userId = 'MOCK_USER_ID_AFTER_AUTH'; // TODO: 認証成功後にユーザーIDを取得する
        const result = await this.authService.loginWithTx(
          prismaTx,
          userId,
          txDateTime,
          body,
        );

        // 3. TODO: 結果を返却
        return result;
      },
    );
  }

  // ログアウト (POST/logout)
  /**
   * ログアウト
   * @param body AuthLogoutRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns AuthLogoutResponseDto
   */
  async logout(
    body: AuthLogoutRequestDto,
    userId: string, // authRequired === true
  ): Promise<AuthLogoutResponseDto> {
    // ログアウトはトークン無効化(DB write: Users.token = null)を含むため、Orchestratorでトランザクション管理を行う
    const txDateTime = new Date();

    await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. TODO: Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTimeを渡す
        await this.authService.logoutWithTx(prismaTx, userId, txDateTime, body);
      },
    );

    return {}; // 204 No Content
  }
}
