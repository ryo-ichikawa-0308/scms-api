import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { UserServices, Prisma } from '@prisma/client';
import {
  SelectUserServicesDto,
  CreateUserServicesDto,
  UserServicesDetailDto,
} from 'src/database/dto/user_services.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class UserServicesDao {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ユーザー提供サービステーブルをIDで取得する
   * @param id ユーザー提供サービスID
   * @returns ユーザー提供サービステーブル(関連テーブル含む)
   */
  async selectUserServicesById(
    id: string,
  ): Promise<UserServicesDetailDto | null> {
    try {
      const query: Prisma.UserServicesFindFirstArgs = {
        where: {
          id: id,
          isDeleted: false,
        },
        include: {
          users: true,
          services: true,
        },
      };
      const userServicesDetail = (await this.prisma.userServices.findFirst(
        query,
      )) as UserServicesDetailDto | null;
      return userServicesDetail;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        'ユーザー提供サービス情報の取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービステーブルのロックを取得する
   * @param prismaTx トランザクション
   * @param id ユーザーID
   * @returns ロックしたレコード
   */
  async lockUserServicesById(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<UserServices | null> {
    const lockedRecords: UserServices[] = await prismaTx.$queryRaw<
      UserServices[]
    >`
        SELECT * FROM UserServices 
        WHERE id = ${id} AND is_deleted = false
        FOR UPDATE
      `;
    if (lockedRecords.length === 0) {
      throw new NotFoundException(
        `ロック対象の契約レコード (ID: ${id}) が見つかりません。`,
      );
    }
    return lockedRecords[0];
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
      };

      if (dto.id) where.id = { contains: dto.id };
      if (dto.usersId) where.usersId = { contains: dto.usersId };
      if (dto.servicesId) where.servicesId = { contains: dto.servicesId };
      if (dto.stock !== undefined) where.stock = dto.stock;
      // 監査項目は検索対象外

      const orderBy: Prisma.UserServicesOrderByWithRelationInput = {};
      if (dto.sortBy) {
        const sortOrder = dto.sortOrder || 'asc';
        orderBy[dto.sortBy] = sortOrder;
      }

      const userServices = await this.prisma.userServices.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
        orderBy: orderBy,
      });
      return userServices;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略
      }
      throw new InternalServerErrorException(
        'ユーザー提供サービスの取得中に予期せぬエラーが発生しました。',
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
      };

      if (dto.id) where.id = { contains: dto.id };
      if (dto.usersId) where.usersId = { contains: dto.usersId };
      if (dto.servicesId) where.servicesId = { contains: dto.servicesId };
      if (dto.stock !== undefined) where.stock = dto.stock;
      // 監査項目は検索対象外

      const count = await this.prisma.userServices.count({
        where,
      });
      return count;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略
      }
      throw new InternalServerErrorException(
        'ユーザー提供サービスの件数取得中に予期せぬエラーが発生しました。',
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
      const data: Prisma.UserServicesCreateInput = {
        id: dto.id,
        stock: dto.stock,
        registeredAt: dto.registeredAt,
        registeredBy: dto.registeredBy,
        updatedAt: dto.updatedAt,
        updatedBy: dto.updatedBy,
        isDeleted: dto.isDeleted,
        users: { connect: { id: dto.usersId } },
        services: { connect: { id: dto.servicesId } },
      };

      return await prismaTx.userServices.create({ data });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException(
            '一意制約に違反するユーザー提供サービスの登録です。',
          );
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するユーザー提供サービスの登録です。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザー提供サービスの新規登録中に予期せぬエラーが発生しました。',
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
      const { id, usersId, servicesId, ...data } = updateData;

      return await prismaTx.userServices.update({
        where: { id },
        data: {
          ...data,
          users: { connect: { id: usersId } },
          services: { connect: { id: servicesId } },
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException(
            '一意制約に違反するユーザー提供サービスの更新です。',
          );
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するユーザー提供サービスの更新です。',
          );
        }
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException(
            '更新対象のユーザー提供サービスが見つかりません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザー提供サービスの更新中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * ユーザー提供サービスを論理削除する
   * @param prismaTx トランザクション
   * @param id ユーザー提供サービスのID(主キー)
   * @param updatedAt トランザクション開始日時
   * @param updatedBy トランザクションを行うユーザーのID
   * @returns 論理削除したレコード
   */
  async softDeleteUserServices(
    prismaTx: PrismaTransaction,
    id: string,
    updatedAt: Date,
    updatedBy: string,
  ): Promise<UserServices> {
    try {
      return await prismaTx.userServices.update({
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
            '論理削除対象のユーザー提供サービスが見つかりません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザー提供サービスの論理削除中に予期せぬエラーが発生しました。',
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
      return await prismaTx.userServices.delete({
        where: { id },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException(
            '物理削除対象のユーザー提供サービスが見つかりません。',
          );
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するため、ユーザー提供サービスの物理削除ができません。',
          );
        }
      }
      throw new InternalServerErrorException(
        'ユーザー提供サービスの物理削除中に予期せぬエラーが発生しました。',
      );
    }
  }
}
