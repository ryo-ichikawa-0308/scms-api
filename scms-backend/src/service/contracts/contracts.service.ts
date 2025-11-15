import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { ContractsDao } from 'src/database/dao/contracts.dao';
import { ContractsListRequestDto } from '../../domain/contracts/dto/contracts-list-request.dto';
import { ContractsListResponseDto } from '../../domain/contracts/dto/contracts-list-response.dto';
import { ContractsDetailResponseDto } from '../../domain/contracts/dto/contracts-detail-response.dto';
import { ContractsCreateRequestDto } from '../../domain/contracts/dto/contracts-create-request.dto';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import {
  SelectContractsDto,
  CreateContractsDto,
  ContractsDetailDto,
} from 'src/database/dto/contracts.dto';
import { Contracts, UserServices } from '@prisma/client';
import { ContractsResponseContractItemDto } from 'src/domain/contracts/dto/contracts-response-contract-item.dto';
import { CommonService } from '../common/common.service';

/**
 * 契約に関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class ContractsService {
  constructor(
    private readonly commonService: CommonService,
    private readonly contractsDao: ContractsDao,
    private readonly userServicesDao: UserServicesDao,
  ) {}

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
    // 読み取り系Serviceのロジック
    const query: SelectContractsDto = {
      usersId: userId,
      limit: body.limit,
      offset: body.offset,
    };
    const totalCount = await this.contractsDao.countContracts(query);
    const contracts = (await this.contractsDao.selectContracts(
      query,
    )) as ContractsDetailDto[];

    // レスポンスDTOに詰め替え
    const resContracts: ContractsResponseContractItemDto[] = contracts.map(
      (item) => {
        return {
          id: item.id,
          usersId: item.usersId,
          userServicesId: item.userServicesId,
          quantity: item.quantity,
          name: item.userServices.services.name,
          unit: item.userServices.services.unit,
        };
      },
    );

    // ページング計算
    const paging = this.commonService.calcResponsePaging(
      totalCount,
      body.offset,
      body.limit,
    );

    return new ContractsListResponseDto({
      ...paging,
      contracts: resContracts,
    });
  }

  /**
   * 契約詳細
   * @param id 契約ID
   * @returns ContractsDetailResponseDto
   */
  async detail(id: string): Promise<ContractsDetailResponseDto> {
    // 読み取り系Serviceのロジック
    const contract = await this.contractsDao.selectContractsById(id);
    if (!contract) throw new NotFoundException('該当データが見つかりません');

    const response = new ContractsDetailResponseDto({
      id: contract.id,
      usersId: contract.usersId,
      userServicesId: contract.userServicesId,
      quantity: contract.quantity,
      name: contract.userServices.services.name,
      unit: contract.userServices.services.unit,
    });

    return response;
  }

  /**
   * サービス契約 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body ContractsCreateRequestDto
   * @returns 作成した契約のID
   */
  async createWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: ContractsCreateRequestDto,
  ): Promise<string> {
    // 1. RequestDtoからDB登録データ (DAO) へ詰め替え
    const createDto: CreateContractsDto = {
      usersId: userId,
      userServicesId: body.userServiceId,
      quantity: body.quantity,
      registeredAt: txDateTime,
      registeredBy: userId,
    };

    // 2. DAOのtx対応メソッドを呼び出し、DB登録を実行
    const userService = await this.userServicesDao.lockUserServicesById(
      prismaTx,
      createDto.userServicesId,
    );
    if (!userService) {
      throw new NotFoundException('契約対象のサービスが見つかりません');
    }
    if (userService.stock < createDto.quantity) {
      throw new BadRequestException('在庫が足りません');
    }

    // 在庫を減らす
    const userServiceDto: UserServices = {
      ...userService,
      stock: userService.stock - createDto.quantity,
      updatedAt: txDateTime,
      updatedBy: userId,
    };
    await this.userServicesDao.updateUserServices(prismaTx, userServiceDto);
    const contract = await this.contractsDao.createContracts(
      prismaTx,
      createDto,
    );
    if (!contract) {
      throw new InternalServerErrorException(
        '契約データの登録ができませんでした',
      );
    }

    // 3. ID返却
    return contract.id;
  }

  /**
   * サービス解約 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param id 解約するサービスのID
   * @returns void
   */
  async cancelWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    id: string,
  ): Promise<void> {
    // 1. DAOのtx対応メソッドを呼び出し、DB論理削除を実行
    const contract = await this.contractsDao.lockContractsById(prismaTx, id);
    if (!contract) {
      throw new NotFoundException('解約対象の契約が見つかりません');
    }
    const userService = await this.userServicesDao.lockUserServicesById(
      prismaTx,
      contract.userServicesId,
    );
    if (!userService) {
      throw new NotFoundException('解約対象のサービスが見つかりません');
    }
    // 在庫を戻す
    const userServiceDto: UserServices = {
      ...userService,
      stock: userService.stock + contract.quantity,
      updatedAt: txDateTime,
      updatedBy: userId,
    };
    const contractDto: Contracts = {
      ...contract,
      quantity: 0,
      updatedAt: txDateTime,
      updatedBy: userId,
    };
    await this.contractsDao.updateContracts(prismaTx, contractDto);
    await this.userServicesDao.updateUserServices(prismaTx, userServiceDto);
    // 契約データを論理削除
    await this.contractsDao.softDeleteContracts(
      prismaTx,
      id,
      txDateTime,
      userId,
    );
  }

  /**
   * 契約対象のサービスと在庫があることを確認する。
   * @param body ContractsCancelRequestDto
   * @returns 契約可能な状態であればtrue
   */
  async isValidContract(body: ContractsCreateRequestDto): Promise<boolean> {
    const userService = await this.userServicesDao.selectUserServicesById(
      body.userServiceId,
    );
    if (!userService) {
      throw new NotFoundException('契約対象のサービスが見つかりません');
    }
    if (userService.stock < body.quantity) {
      throw new BadRequestException('在庫が足りません');
    }
    return true;
  }

  /**
   * 解約対象の契約とサービスがあることを確認する。
   * @param id 解約するサービスID
   * @returns 解約可能な状態であればtrue
   */
  async isValidCancel(id: string): Promise<boolean> {
    const contract = await this.contractsDao.selectContractsById(id);
    if (!contract) {
      throw new NotFoundException('解約対象の契約が見つかりません');
    }
    const userService = await this.userServicesDao.selectUserServicesById(
      contract.userServicesId,
    );
    if (!userService) {
      throw new NotFoundException('解約対象のサービスが見つかりません');
    }
    return true;
  }
}
