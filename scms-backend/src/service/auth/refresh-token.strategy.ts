import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload';
import { UsersDao } from 'src/database/dao/users.dao';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly usersDao: UsersDao,
    private jwtService: JwtService,
  ) {
    super({
      // AuthorizationヘッダーのBearerスキームからJWTを抽出する
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'YOUR_SECRET_KEY_FROM_ENV', // TODO: あとで環境変数取得に変更
      ignoreExpiration: false,
      passReqToCallback: true,
    });
  }
  // 署名検証に成功すると、このメソッドが呼ばれる
  async validate(req: Request, payload: JwtPayload) {
    // リクエストヘッダからAuthorizationを取得
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorizationヘッダーがありません。');
    }
    // リフレッシュトークンを取得
    const refreshToken =
      typeof authorizationHeader === 'string'
        ? authorizationHeader.replace('Bearer', '').trim()
        : null;

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
}
