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
   * ユーザー提供サービステーブルをID組み合わせで取得する
   * @param usersId ユーザーID
   * @param servicesId サービスID
   * @returns ユーザー提供サービステーブル(関連テーブル含む)
   */
  async selectUserServicesByIds(
    usersId: string,
    servicesId: string,
  ): Promise<UserServicesDetailDto | null> {
    try {
      const query: Prisma.UserServicesFindFirstArgs = {
        where: {
          usersId: usersId,
          servicesId: servicesId,
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
    try {
      const lockedRecords: UserServices[] = await prismaTx.$queryRaw<
        UserServices[]
      >`
        SELECT id, stock FROM user_services 
        WHERE id = ${id} AND is_deleted = false
        FOR UPDATE
      `;
      return lockedRecords[0];
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        'ユーザ提供サービステーブルのロック中に予期せぬエラーが発生しました',
      );
    }
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
      const query: Prisma.UserServicesFindManyArgs = {
        where: {
          isDeleted: false,
          services: {
            name: { contains: dto.servicesName },
          },
        },
        include: {
          users: true,
          services: true,
        },
      };
      const orderBy: Prisma.UserServicesOrderByWithRelationInput = {};
      if (dto.sortBy) {
        const sortOrder = dto.sortOrder || 'asc';
        orderBy[dto.sortBy] = sortOrder;
      }
      query.skip = dto.offset;
      query.take = dto.limit;
      query.orderBy = orderBy;
      const userServices = await this.prisma.userServices.findMany(query);
      return userServices;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
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
      const query: Prisma.UserServicesCountArgs = {
        where: {
          isDeleted: false,
          services: {
            name: { contains: dto.servicesName },
          },
        },
      };
      const count = await this.prisma.userServices.count(query);
      return count;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
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
      const { id, ...data } = updateData;

      return await prismaTx.userServices.update({
        where: { id },
        data: {
          ...data,
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
}
