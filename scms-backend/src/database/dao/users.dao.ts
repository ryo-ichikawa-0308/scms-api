import {
  Injectable,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.service';
import { SelectUsersDto, CreateUsersDto } from 'src/database/dto/users.dto';
import { Prisma, Users } from '@prisma/client';

@Injectable()
export class UsersDao {
  private readonly client: PrismaService;
  private readonly prismaTx: PrismaTransaction;

  constructor(client: PrismaService) {
    this.client = client;
    // prismaTxはトランザクションメソッドでのみ使用
  }

  /**
   * ユーザーを取得する
   * @param dto ユーザーの検索用DTO
   * @returns 取得したテーブルの配列
   */
  async selectUsers(dto: SelectUsersDto): Promise<Users[]> {
    try {
      const where: Prisma.UsersWhereInput = {
        isDeleted: false,
        ...(dto.id && { id: dto.id }),
        ...(dto.name && { name: { contains: dto.name } }),
        ...(dto.email && { email: { contains: dto.email } }),
      };

      const users = await this.client.users.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
      });

      return users as Users[];
    } catch (error) {
      console.error('selectUsers error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザーの件数を取得する
   * @param dto ユーザーの検索用DTO
   * @returns 取得したレコードの件数
   */
  async countUsers(dto: SelectUsersDto): Promise<number> {
    try {
      const where: Prisma.UsersWhereInput = {
        isDeleted: false,
        ...(dto.id && { id: dto.id }),
        ...(dto.name && { name: { contains: dto.name } }),
        ...(dto.email && { email: { contains: dto.email } }),
      };

      const count = await this.client.users.count({ where });
      return count;
    } catch (error) {
      console.error('countUsers error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザーを新規登録する
   * @param prismaTx トランザクション
   * @param dto ユーザーの登録用DTO
   * @returns 登録したレコード
   */
  async createUsers(
    prismaTx: PrismaTransaction,
    dto: CreateUsersDto,
  ): Promise<Users> {
    try {
      const user = await prismaTx.users.create({
        data: {
          ...(dto as Prisma.UsersCreateInput),
        },
      });
      return user as Users;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('一意制約違反が発生しました。');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('外部キー違反が発生しました。');
        }
      }
      console.error('createUsers error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザーを更新する
   * @param prismaTx トランザクション
   * @param updateData ユーザーのPrisma型
   * @returns 更新したレコード
   */
  async updateUsers(
    prismaTx: PrismaTransaction,
    updateData: Users,
  ): Promise<Users> {
    try {
      const { id, ...data } = updateData;
      const user = await prismaTx.users.update({
        where: { id },
        data: data as Prisma.UsersUpdateInput,
      });
      return user as Users;
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
      console.error('updateUsers error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザーを論理削除する
   * @param prismaTx トランザクション
   * @param id ユーザーのID(主キー)
   * @returns 論理削除したレコード
   */
  async softDeleteUsers(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Users> {
    try {
      const user = await prismaTx.users.update({
        where: { id },
        data: {
          isDeleted: false, // 論理削除フラグを立てる
          // 監査フィールドの更新はサービスクラスが保証する
        },
      });
      return user as Users;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            '論理削除対象のレコードが見つかりません。',
          );
        }
      }
      console.error('softDeleteUsers error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * ユーザーを物理削除する
   * @param prismaTx トランザクション
   * @param id ユーザーのID(主キー)
   * @returns 物理削除したレコード
   */
  async hardDeleteUsers(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Users> {
    try {
      const user = await prismaTx.users.delete({
        where: { id },
      });
      return user as Users;
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
      console.error('hardDeleteUsers error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }
}
