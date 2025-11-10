import { Injectable } from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';
// import { ContractsDao } from 'src/database/contracts.dao';

import { ContractsListRequestDto } from '../../domain/contracts/dto/contracts-list-request.dto';
import { ContractsListResponseDto } from '../../domain/contracts/dto/contracts-list-response.dto';
import { ContractsDetailQueryDto } from '../../domain/contracts/dto/contracts-detail-query.dto';
import { ContractsDetailResponseDto } from '../../domain/contracts/dto/contracts-detail-response.dto';
import { ContractsCreateRequestDto } from '../../domain/contracts/dto/contracts-create-request.dto';
import { ContractsCreateResponseDto } from '../../domain/contracts/dto/contracts-create-response.dto';
import { ContractsCancelQueryDto } from '../../domain/contracts/dto/contracts-cancel-query.dto';

// import { SelectContractsDto, CreateContractsDto } from 'src/database/contracts.dto';

/**
 * 契約に関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class ContractsService {
  // constructor(
  //   private readonly contractsDao: ContractsDao,
  // ) {}

  // 契約一覧 (POST/list)
  /**
   * 契約一覧
   * @param body ContractsListRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns ContractsListResponseDto
   */
  async list(
    body: ContractsListRequestDto,
    userId: string,
  ): Promise<ContractsListResponseDto> {
    // TODO: 読み取り系Serviceのロジックを実装
    return {
      totalCount: 0,
      totalPages: 0,
      contracts: [],
      currentPage: 1,
      limit: body.limit,
      offset: body.offset,
    } as ContractsListResponseDto; // Mock
  }

  // 契約詳細 (GET/detail)
  /**
   * 契約詳細
   * @param query ContractsDetailQueryDto
   * @param userId 認証情報から取得したユーザーID
   * @returns ContractsDetailResponseDto
   */
  async detail(
    query: ContractsDetailQueryDto,
    userId: string,
  ): Promise<ContractsDetailResponseDto> {
    // TODO: 読み取り系Serviceのロジックを実装
    // const contract = await this.contractsDao.selectContracts({ id: query.id, usersId: userId });
    // if (!contract) throw new NotFoundException('該当データが見つかりません');

    return { id: query.id } as ContractsDetailResponseDto; // Mock
  }

  // サービス契約 (POST/create) - トランザクション対応メソッド
  /**
   * サービス契約 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body ContractsCreateRequestDto
   * @returns ContractsCreateResponseDto
   */
  async createWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: ContractsCreateRequestDto,
  ): Promise<ContractsCreateResponseDto> {
    // 1. TODO: RequestDtoからDB登録データ (DAO) へ詰め替え
    // const createDto: CreateContractsDto = { ... };

    // 2. TODO: ビジネスロジックの実行 (バリデーション、採番、属性付与など)
    // 3. TODO: DAOのtx対応メソッドを呼び出し、DB登録を実行 (this.contractsDao.createContracts(prismaTx, createDto))
    const createdId = 'MOCK_CONTRACT_ID'; // Mock

    // 4. TODO: DB結果を ResponseDto へ詰め替え
    return { id: createdId } as ContractsCreateResponseDto;
  }

  // サービス解約 (PATCH/cancel) - トランザクション対応メソッド
  /**
   * サービス解約 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body ContractsCancelRequestDto
   * @param query ContractsCancelQueryDto
   * @returns ContractsCancelResponseDto (void)
   */
  async cancelWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    query: ContractsCancelQueryDto,
  ): Promise<void> {
    // 1. TODO: 契約IDの存在チェックとアクセス権限チェック
    // 2. TODO: DAOのtx対応メソッドを呼び出し、DB論理削除を実行 (this.contractsDao.softDeleteContracts(prismaTx, query.id))
  }
}
