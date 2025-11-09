import { PrismaClient } from '@prisma/client';

// トランザクションの型
export type PrismaTransaction = Omit<
  PrismaClient,
  | '$connect'
  | '$disconnect'
  | '$on'
  | '$off'
  | '$use'
  | '$extends'
  | '$withExtensions'
>;
