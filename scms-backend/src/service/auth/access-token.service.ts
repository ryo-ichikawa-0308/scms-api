import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersDao } from 'src/database/dao/users.dao';
import { JwtPayload } from './jwt-payload';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AccessTokenService extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersDao: UsersDao,
    private jwtService: JwtService,
  ) {
    super({
      // AuthorizationヘッダーのBearerスキームからJWTを抽出する
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'YOUR_SECRET_KEY_FROM_ENV', // TODO: あとで環境変数取得に変更
      ignoreExpiration: false,
    });
  }

  // 署名検証に成功すると、このメソッドが呼ばれる
  async validate(payload: JwtPayload) {
    const user = await this.usersDao.selectUsersById(payload.userId);
    if (!user) {
      throw new UnauthorizedException('このユーザーは認証されていません');
    }
    return {
      userId: payload.userId,
      username: payload.username,
    };
  }
  /**
   * アクセストークンを生成する
   * @param userId ペイロードに登録するユーザーID
   * @param username ペイロードに登録するユーザー名
   * @returns アクセストークン
   */
  generateAccessToken(userId: string, username: string): string {
    const payload = { userId, username };
    const accessToken = this.jwtService.sign(payload);
    return accessToken;
  }
}
