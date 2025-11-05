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
  SelectContractsDto,
  CreateContractsDto,
} from 'src/database/dto/contracts.dto';
import { Contracts, Prisma } from '@prisma/client';

@Injectable()
export class ContractsDao {
  private readonly client: PrismaService;

  constructor(client: PrismaService) {
    this.client = client;
  }

  /**
   * 契約を取得する
   * @param dto 契約の検索用DTO
   * @returns 取得したテーブルの配列
   */
  async selectContracts(dto: SelectContractsDto): Promise<Contracts[]> {
    try {
      const where: Prisma.ContractsWhereInput = {
        isDeleted: false,
        ...(dto.id && { id: dto.id }),
        ...(dto.usersId && { usersId: dto.usersId }),
        ...(dto.userServicesId && { userServicesId: dto.userServicesId }),
        ...(dto.quantity && { quantity: dto.quantity }),
      };

      const contracts = await this.client.contracts.findMany({
        where,
        skip: dto.offset,
        take: dto.limit,
      });

      return contracts as Contracts[];
    } catch (error) {
      console.error('selectContracts error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const where: Prisma.ContractsWhereInput = {
        isDeleted: false,
        ...(dto.usersId && { usersId: dto.usersId }),
        ...(dto.userServicesId && { userServicesId: dto.userServicesId }),
      };

      const count = await this.client.contracts.count({ where });
      return count;
    } catch (error) {
      console.error('countContracts error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const contract = await prismaTx.contracts.create({
        data: {
          ...(dto as Prisma.ContractsCreateInput),
        },
      });
      return contract as Contracts;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('一意制約違反が発生しました。');
        }
        if (error.code === 'P2003') {
          throw new BadRequestException('外部キー違反が発生しました。');
        }
      }
      console.error('createContracts error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const contract = await prismaTx.contracts.update({
        where: { id },
        data: data as Prisma.ContractsUpdateInput,
      });
      return contract as Contracts;
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
      console.error('updateContracts error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }

  /**
   * 契約を論理削除する
   * @param prismaTx トランザクション
   * @param id 契約のID(主キー)
   * @returns 論理削除したレコード
   */
  async softDeleteContracts(
    prismaTx: PrismaTransaction,
    id: string,
  ): Promise<Contracts> {
    try {
      const contract = await prismaTx.contracts.update({
        where: { id },
        data: {
          isDeleted: true,
        },
      });
      return contract as Contracts;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            '論理削除対象のレコードが見つかりません。',
          );
        }
      }
      console.error('softDeleteContracts error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
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
      const contract = await prismaTx.contracts.delete({
        where: { id },
      });
      return contract as Contracts;
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
      console.error('hardDeleteContracts error:', error);
      throw new InternalServerErrorException(
        'DB接続エラーなど、予期せぬ例外が発生しました。',
      );
    }
  }
}
