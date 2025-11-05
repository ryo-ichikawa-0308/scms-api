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
  SelectUserServicesDto,
  CreateUserServicesDto,
} from 'src/database/dto/user_services.dto';
import { Prisma, UserServices } from '@prisma/client';

@Injectable()
export class UserServicesDao {
  private readonly client: PrismaService;

  constructor(client: PrismaService) {
    this.client = client;
  }

  /**
   * ユーザー提供サービスを取得する
   * @param dto ユーザー提供サービスの検索用DTO
   * @returns 取得したテーブルの配列
   */
  async selectUserServices(
    dto: SelectUserServicesDto,
  ): Promise<UserServices[]> {
    try {
      const where: Prisma.UserServicesWhereInput = {
        isDeleted: false,
        ...(dto.id && { id: dto.id }),
        ...(dto.usersId && { usersId: dto.usersId }),
        ...(dto.servicesId && { servicesId: dto.servicesId }),
        ...(dto.stock && { stock: dto.stock }),
      };

      const userServices = await this.client.userServices.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
      });

      return userServices as UserServices[];
    } catch (error) {
      console.error('selectUserServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービスの件数を取得する
   * @param dto ユーザー提供サービスの検索用DTO
   * @returns 取得したレコードの件数
   */
  async countUserServices(dto: SelectUserServicesDto): Promise<number> {
    try {
      const where: Prisma.UserServicesWhereInput = {
        isDeleted: false,
        ...(dto.usersId && { usersId: dto.usersId }),
        ...(dto.servicesId && { servicesId: dto.servicesId }),
      };

      const count = await this.client.userServices.count({ where });
      return count;
    } catch (error) {
      console.error('countUserServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービスを新規登録する
   * @param prismaTx トランザクション
   * @param dto ユーザー提供サービスの登録用DTO
   * @returns 登録したレコード
   */
  async createUserServices(
    prismaTx: PrismaTransaction,
    dto: CreateUserServicesDto,
  ): Promise<UserServices> {
    try {
      const userService = await prismaTx.userServices.create({
        data: {
          ...(dto as Prisma.UserServicesCreateInput),
        },
      });
      return userService as UserServices;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('一意制約違反が発生しました。');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('外部キー違反が発生しました。');
        }
      }
      console.error('createUserServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービスを更新する
   * @param prismaTx トランザクション
   * @param updateData ユーザー提供サービスのPrisma型
   * @returns 更新したレコード
   */
  async updateUserServices(
    prismaTx: PrismaTransaction,
    updateData: UserServices,
  ): Promise<UserServices> {
    try {
      const { id, ...data } = updateData;
      const userService = await prismaTx.userServices.update({
        where: { id },
        data: data as Prisma.UserServicesUpdateInput,
      });
      return userService as UserServices;
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
      console.error('updateUserServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービスを論理削除する
   * @param prismaTx トランザクション
   * @param id ユーザー提供サービスのID(主キー)
   * @returns 論理削除したレコード
   */
  async softDeleteUserServices(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<UserServices> {
    try {
      const userService = await prismaTx.userServices.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });
      return userService as UserServices;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            '論理削除対象のレコードが見つかりません。',
          );
        }
      }
      console.error('softDeleteUserServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービスを物理削除する
   * @param prismaTx トランザクション
   * @param id ユーザー提供サービスのID(主キー)
   * @returns 物理削除したレコード
   */
  async hardDeleteUserServices(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<UserServices> {
    try {
      const userService = await prismaTx.userServices.delete({
        where: { id },
      });
      return userService as UserServices;
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
      console.error('hardDeleteUserServices error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }
}
