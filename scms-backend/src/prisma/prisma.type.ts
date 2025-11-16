import { PrismaService } from './prisma.service';
export const PRISMA_TRANSACTION = 'PRISMA_TRANSACTION';
// トランザクションの型
export type PrismaTransaction = Omit<
  PrismaService,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$off'
  | '$use'
  | '$extends'
  | '$withExtensions'
>;
