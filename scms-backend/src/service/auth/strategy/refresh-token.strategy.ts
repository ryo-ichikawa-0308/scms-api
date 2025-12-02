import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../types/jwt-payload';
import { UsersDao } from 'src/database/dao/users.dao';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly usersDao: UsersDao,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        const refreshTokenKey =
          configService.getOrThrow<string>('REFRESH_TOKEN_KEY');
        const refreshToken = this.getRefreshTokenFromCookie(
          req.headers.cookie || '',
          refreshTokenKey,
        );
        return refreshToken;
      },
      secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }

  /**
   * 署名検証後、リフレッシュトークンを検証する。
   * @param req リクエスト
   * @param payload JWTペイロード
   * @returns 認証成功したら、ペイロードのデータを返す。
   */
  async validate(req: Request, payload: JwtPayload) {
    // リフレッシュトークンを取得
    const refreshTokenKey =
      this.configService.getOrThrow<string>('REFRESH_TOKEN_KEY');
    const refreshToken = this.getRefreshTokenFromCookie(
      req.headers.cookie || '',
      refreshTokenKey,
    );
    if (!refreshToken) {
      throw new UnauthorizedException('無効なリフレッシュトークン形式です。');
    }
    const user = await this.usersDao.selectUsersById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('このユーザーは認証されていません');
    }
    if (!user.token || user.token !== refreshToken) {
      throw new UnauthorizedException('このユーザーは認証されていません');
    }
    return {
      userId: payload.userId,
      username: payload.username,
    };
  }

  /**
   * リフレッシュトークンを生成する
   * @param userId ペイロードに登録するユーザーID
   * @param username ペイロードに登録するユーザー名
   * @returns リフレッシュトークン
   */
  generateRefreshToken(userId: string, username: string): string {
    const payload = { userId, username };
    const refreshToken = this.jwtService.sign(payload);
    return refreshToken;
  }

  /**
   * Cookie文字列からリフレッシュトークンを抽出する
   * @param cookieString Cookie文字列
   * @param refreshTokenKey 環境変数から取得したリフレッシュトークンのキー
   * @returns リフレッシュトークン
   */
  private getRefreshTokenFromCookie(
    cookieString: string,
    refreshTokenKey: string,
  ): string {
    const regExp = new RegExp(refreshTokenKey + '=([^;]+)');
    const match = cookieString.match(regExp);
    const refreshTokenRegExp = match ? match[1] : null;
    return refreshTokenRegExp || '';
  }
}
