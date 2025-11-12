import { Inject, Injectable } from '@nestjs/common';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthService } from '../../service/auth/auth.service';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';

/**
 * Authのオーケストレーションクラス
 */
@Injectable()
export class AuthOrchestrator {
  constructor(
    private readonly authService: AuthService,
    @Inject(PRISMA_TRANSACTION)
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
    // 1. ユーザーのIDとパスワードを認証する
    const userId = await this.authService.getUserId(body.email, body.password);
    const result = this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. Service層のトランザクション対応メソッドを呼び出し、prismaTx, txDateTime, userIdを渡す。
        const txDateTime = new Date();
        const result = await this.authService.loginWithTx(
          prismaTx,
          txDateTime,
          userId,
        );
        // 2. 結果を返却
        return result;
      },
    );
    return result;
  }

  // ログアウト (POST/logout)
  /**
   * ログアウト
   * @param body AuthLogoutRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns void
   */
  async logout(userId: string): Promise<void> {
    // ログアウトはトークン無効化(DB write: Users.token = null)を含むため、Orchestratorでトランザクション管理を行う
    const txDateTime = new Date();
    await this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTimeを渡す
        await this.authService.logoutWithTx(prismaTx, userId, txDateTime);
      },
    );
  }
  /**
   * トークンリフレッシュ
   * @param userId リクエストヘッダのトークンから抽出したユーザーID
   * @param userName リクエストヘッダのトークンから抽出したユーザー名
   * @returns AuthRefreshResponseDto
   */
  async refresh(
    userId: string,
    userName: string,
  ): Promise<AuthRefreshResponseDto> {
    // 2. TODO: 作成者IDとトランザクション開始作成時刻の取得 (認証を前提としないため、ここでユーザーIDは不要)

    // 3. TODO: PrismaTransactionServiceを呼び出し、トランザクションを開始

    const txDateTime = new Date();
    return this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. TODO: 項目間関連チェック(Service層のメソッドを呼び出す)

        // 4. TODO: Service層のトランザクション対応メソッドを呼び出し、prismaTx, 各種dtoを渡す
        const result = await this.authService.refreshWithTx(
          prismaTx,
          txDateTime,
          userId,
          userName,
        );

        // 5. TODO: 複数のリソースを跨ぐ処理や、DB以外の処理があればここに実装する。

        return result;
      },
    );
  }
}
