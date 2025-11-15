import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { Services, Prisma } from '@prisma/client';
import { CreateServicesDto } from 'src/database/dto/services.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ServicesDao {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * サービス名でサービスを取得する
   * @param name サービス名
   * @returns サービステーブルのレコード
   */
  async selectServicesByName(name: string): Promise<Services | null> {
    try {
      const where: Prisma.ServicesWhereInput = {
        name: name,
        isDeleted: false,
      };
      const service = await this.prisma.services.findFirst({ where });
      return service;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        'サービスの取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * サービスを新規登録する
   * @param prismaTx トランザクション
   * @param dto サービスの登録用DTO
   * @returns 登録したレコード
   */
  async createServices(
    prismaTx: PrismaTransaction,
    dto: CreateServicesDto,
  ): Promise<Services> {
    try {
      const data: Prisma.ServicesCreateInput = {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        unit: dto.unit,
        registeredAt: dto.registeredAt,
        registeredBy: dto.registeredBy,
        updatedAt: dto.updatedAt,
        updatedBy: dto.updatedBy,
        isDeleted: dto.isDeleted,
      };

      return await prismaTx.services.create({ data });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException('一意制約に違反するサービスの登録です。');
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するサービスの登録です。',
          );
        }
      }
      throw new InternalServerErrorException(
        'サービスの新規登録中に予期せぬエラーが発生しました。',
      );
    }
  }
}
