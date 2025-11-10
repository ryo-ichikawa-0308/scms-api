import { PrismaService } from './prisma.service';

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
