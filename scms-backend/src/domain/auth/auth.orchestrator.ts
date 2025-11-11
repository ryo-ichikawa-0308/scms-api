import { Inject, Injectable } from '@nestjs/common';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthService } from '../../service/auth/auth.service';

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
    return this.prismaTransaction.$transaction(
      async (prismaTx: PrismaTransaction) => {
        // 1. Service層のトランザクション対応メソッドを呼び出し、prismaTx, userId, txDateTime, bodyを渡す
        const txDateTime = new Date();
        const result = await this.authService.loginWithTx(
          prismaTx,
          txDateTime,
          body,
        );
        // 2. 結果を返却
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
}
