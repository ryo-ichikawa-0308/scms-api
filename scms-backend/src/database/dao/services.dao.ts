import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.service';
import {
  SelectServicesDto,
  CreateServicesDto,
} from 'src/database/dto/services.dto';
import { Prisma, Services } from '@prisma/client';

@Injectable()
export class ServicesDao {
  private readonly client: PrismaService;

  constructor(client: PrismaService) {
    this.client = client;
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
        ...(dto.id && { id: dto.id }),
        ...(dto.name && { name: { contains: dto.name } }),
        ...(dto.description && { description: { contains: dto.description } }),
      };

      const services = await this.client.services.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
      });

      return services as Services[];
    } catch (error) {
      console.error('selectServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
        ...(dto.id && { id: dto.id }),
        ...(dto.name && { name: { contains: dto.name } }),
      };

      const count = await this.client.services.count({ where });
      return count;
    } catch (error) {
      console.error('countServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const service = await prismaTx.services.create({
        data: {
          ...(dto as Prisma.ServicesCreateInput),
        },
      });
      return service as Services;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('一意制約違反が発生しました。');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('外部キー違反が発生しました。');
        }
      }
      console.error('createServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const service = await prismaTx.services.update({
        where: { id },
        data: data as Prisma.ServicesUpdateInput,
      });
      return service as Services;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('一意制約違反が発生しました。');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('外部キー違反が発生しました。');
        }
        if (error.code === 'P2025') {
          throw new NotFoundException('更新対象のレコードが見つかりません。');
        }
      }
      console.error('updateServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * サービスを論理削除する
   * @param prismaTx トランザクション
   * @param id サービスのID(主キー)
   * @returns 論理削除したレコード
   */
  async softDeleteServices(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Services> {
    try {
      const service = await prismaTx.services.update({
        where: { id },
        data: {
          isDeleted: 1,
        },
      });
      return service as Services;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            '論理削除対象のレコードが見つかりません。',
          );
        }
      }
      console.error('softDeleteServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const service = await prismaTx.services.delete({
        where: { id },
      });
      return service as Services;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            '物理削除対象のレコードが見つかりません。',
          );
        }
        if (error.code === 'P2003') {
          throw new BadRequestException(
            '外部キー制約により、物理削除できませんでした。',
          );
        }
      }
      console.error('hardDeleteServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }
}
