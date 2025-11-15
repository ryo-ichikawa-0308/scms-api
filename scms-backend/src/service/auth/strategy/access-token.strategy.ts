import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersDao } from 'src/database/dao/users.dao';
import { JwtPayload } from '../../../types/jwt-payload';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly usersDao: UsersDao,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    super({
      // AuthorizationヘッダーのBearerスキームからJWTを抽出する
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('ACCESS_TOKEN_SECRET'),
      ignoreExpiration: false,
    });
  }

  /**
   * 署名検証後、アクセストークンを検証する。
   * @param req リクエスト
   * @param payload JWTペイロード
   * @returns 認証成功したら、ペイロードのデータを返す。
   */
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
