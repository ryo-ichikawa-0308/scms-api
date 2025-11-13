import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { Services, Prisma } from '@prisma/client';
import {
  SelectServicesDto,
  CreateServicesDto,
} from 'src/database/dto/services.dto';
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
   * サービスを取得する
   * @param dto サービスの検索用DTO
   * @returns 取得したテーブルの配列
   */
  async selectServices(dto: SelectServicesDto): Promise<Services[]> {
    try {
      const where: Prisma.ServicesWhereInput = {
        isDeleted: false,
      };

      if (dto.id) where.id = { contains: dto.id };
      if (dto.name) where.name = { contains: dto.name };
      if (dto.description) where.description = { contains: dto.description };
      if (dto.price !== undefined) where.price = dto.price;
      if (dto.unit) where.unit = { contains: dto.unit };
      // 監査項目は検索対象外

      const orderBy: Prisma.ServicesOrderByWithRelationInput = {};
      if (dto.sortBy) {
        const sortOrder = dto.sortOrder || 'asc';
        orderBy[dto.sortBy] = sortOrder;
      }

      const services = await this.prisma.services.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
        orderBy: orderBy,
      });
      return services;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略
      }
      throw new InternalServerErrorException(
        'サービスの取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * サービスの件数を取得する
   * @param dto サービスの検索用DTO
   * @returns 取得したレコードの件数
   */
  async countServices(dto: SelectServicesDto): Promise<number> {
    try {
      const where: Prisma.ServicesWhereInput = {
        isDeleted: false,
      };

      if (dto.id) where.id = { contains: dto.id };
      if (dto.name) where.name = { contains: dto.name };
      if (dto.description) where.description = { contains: dto.description };
      if (dto.price !== undefined) where.price = dto.price;
      if (dto.unit) where.unit = { contains: dto.unit };
      // 監査項目は検索対象外

      const count = await this.prisma.services.count({
        where,
      });
      return count;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略
      }
      throw new InternalServerErrorException(
        'サービスの件数取得中に予期せぬエラーが発生しました。',
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
        id: dto.id,
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

  /**
   * サービスを更新する
   * @param prismaTx トランザクション
   * @param updateData サービスのPrisma型
   * @returns 更新したレコード
   */
  async updateServices(
    prismaTx: PrismaTransaction,
    updateData: Services,
  ): Promise<Services> {
    try {
      const { id, ...data } = updateData;

      return await prismaTx.services.update({
        where: { id },
        data,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException('一意制約に違反するサービスの更新です。');
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するサービスの更新です。',
          );
        }
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException('更新対象のサービスが見つかりません。');
        }
      }
      throw new InternalServerErrorException(
        'サービスの更新中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * サービスを論理削除する
   * @param prismaTx トランザクション
   * @param id サービスのID(主キー)
   * @param updatedAt トランザクション開始日時
   * @param updatedBy トランザクションを行うユーザーのID
   * @returns 論理削除したレコード
   */
  async softDeleteServices(
    prismaTx: PrismaTransaction,
    id: string,
    updatedAt: Date,
    updatedBy: string,
  ): Promise<Services> {
    try {
      return await prismaTx.services.update({
        where: { id },
        data: {
          isDeleted: true,
          updatedAt: updatedAt,
          updatedBy: updatedBy,
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException(
            '論理削除対象のサービスが見つかりません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'サービスの論理削除中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * サービスを物理削除する
   * @param prismaTx トランザクション
   * @param id サービスのID(主キー)
   * @returns 物理削除したレコード
   */
  async hardDeleteServices(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Services> {
    try {
      return await prismaTx.services.delete({
        where: { id },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException(
            '物理削除対象のサービスが見つかりません。',
          );
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するため、サービスの物理削除ができません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'サービスの物理削除中に予期せぬエラーが発生しました。',
      );
    }
  }
}
