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
import { CreateUsersDto } from 'src/database/dto/users.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UsersDao {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * IDでユーザーを取得する
   * @param id ユーザーID
   * @returns 取得したユーザー
   */
  async selectUsersById(id: string): Promise<Users | null> {
    try {
      const where: Prisma.UsersWhereInput = {
        id: id,
        isDeleted: false,
      };
      const user = await this.prisma.users.findFirst({ where });
      return user;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        'ユーザーの取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * メールアドレスでユーザーを取得する
   * @param email メールアドレス
   * @returns 取得したユーザー
   */
  async selectUsersByEmail(email: string): Promise<Users | null> {
    try {
      const where: Prisma.UsersWhereInput = {
        email: email,
        isDeleted: false,
      };
      const user = await this.prisma.users.findFirst({ where });
      return user;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        'ユーザーの取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * ユーザーテーブルのロックを取得する
   * @param prismaTx トランザクション
   * @param id ユーザーID
   * @returns ロックしたレコード
   */
  async lockUsersById(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Users | null> {
    try {
      const lockedRecords: Users[] = await prismaTx.$queryRaw<Users[]>`
      SELECT id FROM users 
      WHERE id = ${id} AND is_deleted = false
      FOR UPDATE
    `;
      return lockedRecords[0];
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        'ユーザーのロック取得中に予期せぬエラーが発生しました',
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
}
