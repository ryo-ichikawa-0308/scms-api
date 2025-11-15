import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { UsersDao } from 'src/database/dao/users.dao';

import * as bcrypt from 'bcrypt';
import { Users } from '@prisma/client';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { AuthLoginResponseDto } from 'src/domain/auth/dto/auth-login-response.dto';
import { AccessTokenStrategy } from './access-token.strategy';
import { AuthRefreshResponseDto } from 'src/domain/auth/dto/auth-refresh-response.dto';
import { ConfigService } from '@nestjs/config';
const SALT_ROUNDS = 10;

/**
 * 認証に関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersDao: UsersDao,
    private readonly accessTokenStrategy: AccessTokenStrategy,
    private readonly refreshTokenStrategy: RefreshTokenStrategy,
    private readonly configService: ConfigService,
  ) {}

  /**
   * ログイン処理 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param txDateTime トランザクション開始日時
   * @param body AuthLoginRequestDto
   * @returns リフレッシュトークン
   */
  async loginWithTx(
    prismaTx: PrismaTransaction,
    txDateTime: Date,
    userId: string,
  ): Promise<AuthLoginResponseDto> {
    // 1. ユーザー情報を取得
    const loginUser = await this.usersDao.selectUsersById(userId);
    if (!loginUser) {
      throw new NotFoundException('ユーザー情報が存在しません');
    }
    // 2. リフレッシュトークンを生成
    const refreshToken = this.refreshTokenStrategy.generateRefreshToken(
      loginUser.id,
      loginUser.name,
    );

    // 3. ユーザーテーブルのトークンを更新
    const user = await this.usersDao.lockUsersById(prismaTx, loginUser.id);
    if (!user) {
      throw new NotFoundException('ユーザー情報が存在しません');
    }
    const updateDto: Users = {
      ...user,
      token: refreshToken,
      updatedAt: txDateTime,
      updatedBy: loginUser.id,
    };
    await this.usersDao.updateUsers(prismaTx, updateDto);

    // 4. アクセストークンを取得
    const accessToken = this.accessTokenStrategy.generateAccessToken(
      loginUser.id,
      loginUser.name,
    );

    // 5. 認証情報を返却
    const responseDto = new AuthLoginResponseDto({
      id: loginUser.id,
      name: loginUser.name,
      token: {
        accessToken: accessToken,
        expiresIn: this.configService.getOrThrow<number>(
          'ACCESS_TOKEN_EXPIRES',
        ),
      },
      refreshToken: refreshToken,
      refreshTokenExpiresIn: this.configService.getOrThrow<number>(
        'REFRESH_TOKEN_EXPIRES',
      ),
    });
    return responseDto;
  }

  /**
   * ログアウト処理 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body AuthLogoutRequestDto
   * @returns ログアウト成功したらtrue
   */
  async logoutWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
  ): Promise<boolean> {
    // 1. ユーザーテーブルのトークンをNULLに更新
    const user = await this.usersDao.lockUsersById(prismaTx, userId);
    if (!user) {
      throw new NotFoundException('ユーザー情報が存在しません');
    }
    const updateDto: Users = {
      ...user,
      token: null,
      updatedAt: txDateTime,
      updatedBy: userId,
    };
    await this.usersDao.updateUsers(prismaTx, updateDto);

    // 2. ログアウト成功。
    return true;
  }

  /**
   * トークンリフレッシュ (リフレッシュトークンを更新する。)
   * @param prismaTx トランザクション
   * @param txDateTime トランザクション開始日時
   * @param userId ユーザーID
   * @param userName ユーザー名
   * @returns リフレッシュしたトークン
   */
  async refreshWithTx(
    prismaTx: PrismaTransaction,
    txDateTime: Date,
    userId: string,
    userName: string,
  ): Promise<AuthRefreshResponseDto> {
    // 1. DAOのtx対応メソッドを呼び出し、DB更新を実行
    const refreshToken = this.refreshTokenStrategy.generateRefreshToken(
      userId,
      userName,
    );
    const user = await this.usersDao.lockUsersById(prismaTx, userId);
    if (!user) {
      throw new NotFoundException('ユーザー情報が存在しません');
    }
    const updateDto: Users = {
      ...user,
      token: refreshToken,
      updatedAt: txDateTime,
      updatedBy: userId,
    };
    await this.usersDao.updateUsers(prismaTx, updateDto);

    // 2. アクセストークンを取得
    const accessToken = this.accessTokenStrategy.generateAccessToken(
      userId,
      userName,
    );

    // 3. トークン情報を返却
    const refreshDto = new AuthRefreshResponseDto({
      token: {
        accessToken: accessToken,
        expiresIn: this.configService.getOrThrow<number>(
          'ACCESS_TOKEN_EXPIRES',
        ),
      },
      refreshToken: refreshToken,
      refreshTokenExpiresIn: this.configService.getOrThrow<number>(
        'REFRESH_TOKEN_EXPIRES',
      ),
    });
    return refreshDto;
  }

  /**
   * メールアドレスとパスワードで認証する
   * @param email メールアドレス
   * @param password パスワード
   * @returns ユーザーID
   */
  async getUserId(email: string, password: string): Promise<string> {
    const loginUser = await this.usersDao.selectUsersByEmail(email);
    if (!loginUser) {
      throw new UnauthorizedException('認証情報が無効です');
    }
    const isValidPassword = await this.validatePassword(
      password,
      loginUser.password,
    );
    if (isValidPassword == false) {
      throw new UnauthorizedException('認証情報が無効です');
    }
    return loginUser.id;
  }

  /**
   * 生のパスワードをハッシュ化する。
   * @param rawPassword ハッシュ化する生のパスワード
   * @returns ハッシュ化されたパスワード文字列
   */
  async getPasswordHash(rawPassword: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);
    return hashedPassword;
  }

  /**
   * 生のパスワードと既存のハッシュ化されたパスワードを照合する。
   * @param rawPassword ユーザー入力の生のパスワード
   * @param hashedPassword データベースなどに保存されているハッシュ化されたパスワード
   * @returns パスワードが一致すれば true、そうでなければ false
   */
  async validatePassword(
    rawPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    const isMatch = await bcrypt.compare(rawPassword, hashedPassword);
    return isMatch;
  }
}
