import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { Users, Prisma } from '@prisma/client';
import { SelectUsersDto, CreateUsersDto } from 'src/database/dto/users.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsersDao {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ユーザーを取得する
   * @param dto ユーザーの検索用DTO
   * @returns 取得したテーブルの配列
   */
  async selectUsers(dto: SelectUsersDto): Promise<Users[]> {
    try {
      const where: Prisma.UsersWhereInput = {
        isDeleted: false,
      };

      if (dto.id) where.id = { contains: dto.id };
      if (dto.name) where.name = { contains: dto.name };
      if (dto.email) where.email = { contains: dto.email };
      if (dto.password) where.password = { contains: dto.password };
      if (dto.token) where.token = { contains: dto.token };
      // 監査項目は検索対象外

      const orderBy: Prisma.UsersOrderByWithRelationInput = {};
      if (dto.sortBy) {
        // sortByが設定されていて、sortOrderが設定されていない場合は'asc'で補完
        const sortOrder = dto.sortOrder || 'asc';
        orderBy[dto.sortBy] = sortOrder;
      }

      const users = await this.prisma.users.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
        orderBy: orderBy,
      });
      return users;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略し、予期せぬ例外として扱う
      }
      throw new InternalServerErrorException(
        'ユーザーの取得中に予期せぬエラーが発生しました。',
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
      };

      if (dto.id) where.id = { contains: dto.id };
      if (dto.name) where.name = { contains: dto.name };
      if (dto.email) where.email = { contains: dto.email };
      if (dto.password) where.password = { contains: dto.password };
      if (dto.token) where.token = { contains: dto.token };
      // 監査項目は検索対象外

      const count = await this.prisma.users.count({
        where,
      });
      return count;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略し、予期せぬ例外として扱う
      }
      throw new InternalServerErrorException(
        'ユーザーの件数取得中に予期せぬエラーが発生しました。',
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
      const data: Prisma.UsersCreateInput = {
        id: dto.id,
        name: dto.name,
        email: dto.email,
        password: dto.password,
        token: dto.token,
        registeredAt: dto.registeredAt,
        registeredBy: dto.registeredBy,
        updatedAt: dto.updatedAt,
        updatedBy: dto.updatedBy,
        isDeleted: dto.isDeleted,
      };

      return await prismaTx.users.create({ data });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException('一意制約に違反するユーザーの登録です。');
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するユーザーの登録です。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザーの新規登録中に予期せぬエラーが発生しました。',
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

      return await prismaTx.users.update({
        where: { id },
        data,
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException('一意制約に違反するユーザーの更新です。');
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するユーザーの更新です。',
          );
        }
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException('更新対象のユーザーが見つかりません。');
        }
      }
      throw new InternalServerErrorException(
        'ユーザーの更新中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * ユーザーを論理削除する
   * @param prismaTx トランザクション
   * @param id ユーザーのID(主キー)
   * @param updatedAt トランザクション開始日時
   * @param updatedBy トランザクションを行うユーザーのID
   * @returns 論理削除したレコード
   */
  async softDeleteUsers(
    prismaTx: PrismaTransaction,
    id: string,
    updatedAt: Date,
    updatedBy: string,
  ): Promise<Users> {
    try {
      return await prismaTx.users.update({
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
            '論理削除対象のユーザーが見つかりません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザーの論理削除中に予期せぬエラーが発生しました。',
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
      return await prismaTx.users.delete({
        where: { id },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException(
            '物理削除対象のユーザーが見つかりません。',
          );
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するため、ユーザーの物理削除ができません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザーの物理削除中に予期せぬエラーが発生しました。',
      );
    }
  }
}
