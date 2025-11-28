import { JwtPayload } from 'src/types/jwt-payload';
// Expressの型を拡張
declare module 'express' {
  interface Request {
    user?: Express.User;
  }
}
declare namespace Express {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface User extends JwtPayload {}
}
