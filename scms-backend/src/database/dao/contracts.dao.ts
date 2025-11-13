import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { Contracts, Prisma } from '@prisma/client';
import {
  SelectContractsDto,
  CreateContractsDto,
  ContractsDetailDto,
} from 'src/database/dto/contracts.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class ContractsDao {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 契約テーブルをIDで取得する
   * @param id 契約ID
   * @returns 契約テーブル(関連テーブル含む)
   */
  async selectContractsById(id: string): Promise<ContractsDetailDto | null> {
    try {
      const query: Prisma.ContractsFindFirstArgs = {
        where: {
          id: id,
          isDeleted: false,
        },
        include: {
          users: true,
          userServices: {
            include: {
              users: true,
              services: true,
            },
          },
        },
      };
      const contractsDetail = (await this.prisma.contracts.findFirst(
        query,
      )) as ContractsDetailDto | null;
      return contractsDetail;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        '契約の取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * 契約テーブルのロックを取得する
   * @param prismaTx トランザクション
   * @param id ユーザーID
   * @returns ロックしたレコード
   */
  async lockContractsById(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Contracts | null> {
    const lockedRecords: Contracts[] = await prismaTx.$queryRaw<Contracts[]>`
      SELECT id, user_services_id as userServicesId, quantity FROM contracts 
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
   * 契約を取得する
   * @param dto 契約の検索用DTO
   * @returns 取得したテーブルの配列(関連テーブル含む)
   */
  async selectContracts(dto: SelectContractsDto): Promise<Contracts[]> {
    try {
      const query: Prisma.ContractsFindManyArgs = {
        where: {
          isDeleted: false,
          userServices: {
            services: {
              name: { contains: dto.serviceName },
            },
          },
        },
        include: {
          users: true,
          userServices: {
            include: {
              users: true,
              services: true,
            },
          },
        },
      };

      if (dto.id && query.where) query.where.id = { contains: dto.id };
      if (dto.usersId && query.where)
        query.where.usersId = { contains: dto.usersId };
      if (dto.userServicesId && query.where)
        query.where.userServicesId = { contains: dto.userServicesId };
      if (dto.quantity !== undefined && query.where)
        query.where.quantity = dto.quantity;

      const orderBy: Prisma.ContractsOrderByWithRelationInput = {};
      if (dto.sortBy) {
        const sortOrder = dto.sortOrder || 'asc';
        orderBy[dto.sortBy] = sortOrder;
      }
      query.skip = dto.offset;
      query.take = dto.limit;
      query.orderBy = orderBy;
      const contracts = (await this.prisma.contracts.findMany(
        query,
      )) as ContractsDetailDto[];
      return contracts;
    } catch (e) {
      throw new InternalServerErrorException(
        e,
        '契約の取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * 契約の件数を取得する
   * @param dto 契約の検索用DTO
   * @returns 取得したレコードの件数
   */
  async countContracts(dto: SelectContractsDto): Promise<number> {
    try {
      const query: Prisma.ContractsCountArgs = {
        where: {
          isDeleted: false,
          userServices: {
            services: {
              name: { contains: dto.serviceName },
            },
          },
        },
      };

      if (dto.id && query.where) query.where.id = { contains: dto.id };
      if (dto.usersId && query.where)
        query.where.usersId = { contains: dto.usersId };
      if (dto.userServicesId && query.where)
        query.where.userServicesId = { contains: dto.userServicesId };
      if (dto.quantity !== undefined && query.where)
        query.where.quantity = dto.quantity;

      const count = await this.prisma.contracts.count(query);
      return count;
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        // Prisma固有の例外処理はここでは省略
      }
      throw new InternalServerErrorException(
        '契約の件数取得中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * 契約を新規登録する
   * @param prismaTx トランザクション
   * @param dto 契約の登録用DTO
   * @returns 登録したレコード
   */
  async createContracts(
    prismaTx: PrismaTransaction,
    dto: CreateContractsDto,
  ): Promise<Contracts> {
    try {
      const data: Prisma.ContractsCreateInput = {
        id: dto.id,
        quantity: dto.quantity,
        registeredAt: dto.registeredAt,
        registeredBy: dto.registeredBy,
        updatedAt: dto.updatedAt,
        updatedBy: dto.updatedBy,
        isDeleted: dto.isDeleted,
        users: { connect: { id: dto.usersId } },
        userServices: { connect: { id: dto.userServicesId } },
      };

      return await prismaTx.contracts.create({ data });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException('一意制約に違反する契約の登録です。');
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反する契約の登録です。',
          );
        }
      }
      throw new InternalServerErrorException(
        '契約の新規登録中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * 契約を更新する
   * @param prismaTx トランザクション
   * @param updateData 契約のPrisma型
   * @returns 更新したレコード
   */
  async updateContracts(
    prismaTx: PrismaTransaction,
    updateData: Contracts,
  ): Promise<Contracts> {
    try {
      const { id, ...data } = updateData;

      return await prismaTx.contracts.update({
        where: { id },
        data: {
          ...data,
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          // 一意制約違反
          throw new ConflictException('一意制約に違反する契約の更新です。');
        }
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反する契約の更新です。',
          );
        }
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException('更新対象の契約が見つかりません。');
        }
      }
      throw new InternalServerErrorException(
        '契約の更新中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * 契約を論理削除する
   * @param prismaTx トランザクション
   * @param id 契約のID(主キー)
   * @param updatedAt トランザクション開始日時
   * @param updatedBy トランザクションを行うユーザーのID
   * @returns 論理削除したレコード
   */
  async softDeleteContracts(
    prismaTx: PrismaTransaction,
    id: string,
    updatedAt: Date,
    updatedBy: string,
  ): Promise<Contracts> {
    try {
      return await prismaTx.contracts.update({
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
          throw new NotFoundException('論理削除対象の契約が見つかりません。');
        }
      }
      throw new InternalServerErrorException(
        '契約の論理削除中に予期せぬエラーが発生しました。',
      );
    }
  }

  /**
   * 契約を物理削除する
   * @param prismaTx トランザクション
   * @param id 契約のID(主キー)
   * @returns 物理削除したレコード
   */
  async hardDeleteContracts(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Contracts> {
    try {
      return await prismaTx.contracts.delete({
        where: { id },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        if (e.code === 'P2025') {
          // レコードが見つからない
          throw new NotFoundException('物理削除対象の契約が見つかりません。');
        }
        // Contractsは子テーブルを持たないため、通常はP2003は発生しないが、念のため
        if (e.code === 'P2003') {
          // 外部キー違反
          throw new BadRequestException(
            '外部キー制約に違反するため、契約の物理削除ができません。',
          );
        }
      }
      throw new InternalServerErrorException(
        '契約の物理削除中に予期せぬエラーが発生しました。',
      );
    }
  }
}
