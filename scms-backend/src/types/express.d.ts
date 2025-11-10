import { CurrentUser } from 'src/service/auth/jwt.strategy';

// ExpressのRequestオブジェクトを拡張し、認証情報を参照できるようにする。
declare namespace Express {
  type User = CurrentUser;
}
