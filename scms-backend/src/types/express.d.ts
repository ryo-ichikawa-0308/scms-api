import { JwtPayload } from 'src/service/auth/jwt.strategy';
// ExpressのRequestオブジェクトを拡張し、認証情報を参照できるようにする。
declare global {
  declare namespace Express {
    // JWTペイロードと同一型として扱う
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends JwtPayload {}
  }
}
