import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { UsersDao } from 'src/database/dao/users.dao';

import { AuthLoginRequestDto } from '../../domain/auth/dto/auth-login-request.dto';
import { AuthLoginResponseDto } from '../../domain/auth/dto/auth-login-response.dto';

import * as bcrypt from 'bcrypt';
import { Users } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
const SALT_ROUNDS = 10;

/**
 * 認証に関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersDao: UsersDao,
    private readonly jwtService: JwtService,
  ) {}

  // ログイン (POST/login) - トランザクション対応メソッド
  /**
   * ログイン処理 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param txDateTime トランザクション開始日時
   * @param body AuthLoginRequestDto
   * @returns AuthLoginResponseDto
   */
  async loginWithTx(
    prismaTx: PrismaTransaction,
    txDateTime: Date,
    body: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    // 1. 認証処理の実行 (メールアドレス/パスワード照合)
    const loginUser = await this.usersDao.selectUsersByEmail(body.email);
    if (!loginUser) {
      return new UnauthorizedException('認証情報が無効です');
    }
    const isValidPassword = await this.validatePassword(
      body.password,
      loginUser.password,
    );
    if (isValidPassword == false) {
      return new UnauthorizedException('認証情報が無効です');
    }
    // 2. 認証成功後、JWTトークンを生成
    const payload = { username: loginUser.name, userId: loginUser.id };
    const generatedToken = this.jwtService.sign(payload);
    const currentUserId = loginUser.id;
    const userName = loginUser.name;

    // 3. ユーザーテーブルのトークンを更新
    const user = await this.usersDao.lockUsersById(prismaTx, loginUser.id);
    if (!user) {
      throw new NotFoundException('ユーザー情報が存在しません');
    }
    const updateDto: Users = {
      ...user,
      token: generatedToken,
      updatedAt: txDateTime,
      updatedBy: loginUser.id,
    };

    await this.usersDao.updateUsers(prismaTx, updateDto);

    // 4. DB結果を ResponseDto へ詰め替え
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
