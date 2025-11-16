import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { ContractsDao } from 'src/database/dao/contracts.dao';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { CommonService } from '../common/common.service';
import { ContractsListRequestDto } from '../../domain/contracts/dto/contracts-list-request.dto';
import { ContractsListResponseDto } from '../../domain/contracts/dto/contracts-list-response.dto';
import { ContractsCreateRequestDto } from '../../domain/contracts/dto/contracts-create-request.dto';
import {
  ContractsDetailDto,
  SelectContractsDto,
} from 'src/database/dto/contracts.dto';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { Contracts, UserServices } from '@prisma/client';
import { ContractsDetailResponseDto } from 'src/domain/contracts/dto/contracts-detail-response.dto';

// --- モックデータ ---
const MOCK_USER_ID = 'user-abc';
const MOCK_CONTRACT_ID = 'contract-001';
const MOCK_USER_SERVICE_ID = 'us-001';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');

const mockListRequest: ContractsListRequestDto = {
  limit: 10,
  offset: 0,
};

const mockUserServiceRecord: UserServices = {
  id: MOCK_USER_SERVICE_ID,
  usersId: 'another-user',
  servicesId: 'service-id',
  stock: 100, // デフォルト在庫
  registeredAt: MOCK_TX_DATE,
  registeredBy: 'system',
  updatedAt: MOCK_TX_DATE,
  updatedBy: 'system',
  isDeleted: false,
};

const mockContractDetailDto: ContractsDetailDto = {
  id: MOCK_CONTRACT_ID,
  usersId: MOCK_USER_ID,
  userServicesId: MOCK_USER_SERVICE_ID,
  quantity: 5,
  userServices: {
    ...mockUserServiceRecord,
    services: {
      id: 's-id',
      name: 'Mock Service Name',
      unit: '時間',
    },
  },
} as unknown as ContractsDetailDto;

const mockContractRecord: Contracts = {
  id: MOCK_CONTRACT_ID,
  usersId: MOCK_USER_ID,
  userServicesId: MOCK_USER_SERVICE_ID,
  quantity: 5,
  registeredAt: MOCK_TX_DATE,
  registeredBy: MOCK_USER_ID,
  updatedAt: MOCK_TX_DATE,
  updatedBy: MOCK_USER_ID,
  isDeleted: false,
};

const mockPaging = {
  totalCount: 1,
  limit: 10,
  offset: 0,
  totalPage: 1,
};

// --- モックオブジェクト定義 ---
const mockContractsDao = {
  countContracts: jest.fn(),
  selectContracts: jest.fn(),
  selectContractsById: jest.fn(),
  createContracts: jest.fn(),
  lockContractsById: jest.fn(),
  updateContracts: jest.fn(),
  softDeleteContracts: jest.fn(),
};

const mockUserServicesDao = {
  lockUserServicesById: jest.fn(),
  updateUserServices: jest.fn(),
  selectUserServicesById: jest.fn(),
};

const mockCommonService = {
  calcResponsePaging: jest.fn(),
};

const mockPrismaTx: PrismaTransaction = {} as PrismaTransaction;

describe('ContractsService (Service) Test', () => {
  let service: ContractsService;
  let contractsDao: typeof mockContractsDao;
  let userServicesDao: typeof mockUserServicesDao;
  let commonService: typeof mockCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: ContractsDao, useValue: mockContractsDao },
        { provide: UserServicesDao, useValue: mockUserServicesDao },
        { provide: CommonService, useValue: mockCommonService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
    contractsDao = module.get(ContractsDao);
    userServicesDao = module.get(UserServicesDao);
    commonService = module.get(CommonService);

    jest.clearAllMocks();
  });

  it('サービスクラスが定義されていること', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    describe('正常系', () => {
      it('契約のページング情報付きリストが取得できること', async () => {
        contractsDao.countContracts.mockResolvedValue(mockPaging.totalCount);
        contractsDao.selectContracts.mockResolvedValue([mockContractDetailDto]);
        commonService.calcResponsePaging.mockReturnValue(mockPaging);

        const result = await service.list(mockListRequest, MOCK_USER_ID);

        const expectedQuery: SelectContractsDto = {
          usersId: MOCK_USER_ID,
          limit: mockListRequest.limit,
          offset: mockListRequest.offset,
        };
        expect(contractsDao.countContracts).toHaveBeenCalledWith(expectedQuery);
        expect(contractsDao.selectContracts).toHaveBeenCalledWith(
          expectedQuery,
        );

        expect(commonService.calcResponsePaging).toHaveBeenCalled();

        expect(result).toBeInstanceOf(ContractsListResponseDto);
        expect(result.contracts).toBeDefined();
        expect(result.contracts).toHaveLength(1);
        if (result.contracts !== undefined) {
          expect(result.contracts[0].id).toBe(MOCK_CONTRACT_ID);
          expect(result.contracts[0].name).toBe(
            mockContractDetailDto.userServices.services.name,
          );
        }
        expect(result.totalCount).toBe(mockPaging.totalCount);
      });
    });

    describe('異常系', () => {
      it('検索が失敗すること', async () => {
        const mockError = new Error('DB error');
        contractsDao.selectContracts.mockRejectedValue(mockError);

        await expect(
          service.list(mockListRequest, MOCK_USER_ID),
        ).rejects.toThrow(mockError);
      });
      it('件数取得が失敗すること', async () => {
        const mockError = new Error('DB Count error');

        contractsDao.selectContracts.mockResolvedValue([]);
        contractsDao.countContracts.mockRejectedValue(mockError);
        await expect(
          service.list(mockListRequest, MOCK_USER_ID),
        ).rejects.toThrow(mockError);
      });
    });
  });

  describe('detail', () => {
    describe('正常系', () => {
      it('契約の明細が取得できること', async () => {
        contractsDao.selectContractsById.mockResolvedValue(
          mockContractDetailDto,
        );

        const result = await service.detail(MOCK_CONTRACT_ID);

        expect(contractsDao.selectContractsById).toHaveBeenCalledWith(
          MOCK_CONTRACT_ID,
        );
        expect(result.id).toBe(MOCK_CONTRACT_ID);
        expect(result.name).toBe(
          mockContractDetailDto.userServices.services.name,
        );
        // 型確認
        expect(result).toBeInstanceOf(ContractsDetailResponseDto);
      });
    });

    describe('異常系', () => {
      it('契約の明細が取得できないこと', async () => {
        contractsDao.selectContractsById.mockResolvedValue(null);

        await expect(service.detail('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.detail('non-existent-id')).rejects.toThrow(
          '該当データが見つかりません',
        );
      });
    });
  });

  describe('createWithTx', () => {
    const mockCreateRequest: ContractsCreateRequestDto = {
      userServiceId: MOCK_USER_SERVICE_ID,
      quantity: 10,
    };
    const mockLockedUserService: UserServices = {
      ...mockUserServiceRecord,
      stock: 50,
    };

    describe('正常系', () => {
      it('契約のレコードが作成できること', async () => {
        userServicesDao.lockUserServicesById.mockResolvedValue(
          mockLockedUserService,
        );
        contractsDao.createContracts.mockResolvedValue(mockContractRecord);

        const result = await service.createWithTx(
          mockPrismaTx,
          MOCK_USER_ID,
          MOCK_TX_DATE,
          mockCreateRequest,
        );

        expect(userServicesDao.lockUserServicesById).toHaveBeenCalledWith(
          mockPrismaTx,
          mockCreateRequest.userServiceId,
        );

        // 在庫減らしの確認
        expect(userServicesDao.updateUserServices).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining({
            stock: 40,
            updatedBy: MOCK_USER_ID,
          }),
        );

        expect(contractsDao.createContracts).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining({
            usersId: MOCK_USER_ID,
            userServicesId: mockCreateRequest.userServiceId,
            quantity: mockCreateRequest.quantity,
          }),
        );

        expect(result).toBe(MOCK_CONTRACT_ID);
      });
    });

    describe('異常系', () => {
      it('ユーザー提供サービスのロック取得に失敗した場合', async () => {
        userServicesDao.lockUserServicesById.mockResolvedValue(null);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow(NotFoundException);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow('契約対象のサービスが見つかりません');
      });

      it('在庫不足', async () => {
        const lowStockService: UserServices = {
          ...mockLockedUserService,
          stock: 5,
        };
        userServicesDao.lockUserServicesById.mockResolvedValue(lowStockService);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow('在庫が足りません');
      });

      it('契約レコードの作成に失敗', async () => {
        userServicesDao.lockUserServicesById.mockResolvedValue(
          mockLockedUserService,
        );
        contractsDao.createContracts.mockResolvedValue(null);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow(InternalServerErrorException);
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow('契約データの登録ができませんでした');
      });
    });
  });

  describe('cancelWithTx', () => {
    const MOCK_CANCEL_ID = MOCK_CONTRACT_ID;
    const mockLockedUserService: UserServices = {
      ...mockUserServiceRecord,
      stock: 40,
    };
    const mockLockedContract: Contracts = {
      ...mockContractRecord,
      quantity: 10,
    };

    describe('正常系', () => {
      it('解約に成功すること', async () => {
        contractsDao.lockContractsById.mockResolvedValue(mockLockedContract);
        userServicesDao.lockUserServicesById.mockResolvedValue(
          mockLockedUserService,
        );
        contractsDao.softDeleteContracts.mockResolvedValue(undefined);
        contractsDao.updateContracts.mockResolvedValue(mockContractRecord);
        userServicesDao.updateUserServices.mockResolvedValue(
          mockUserServiceRecord,
        );

        await expect(
          service.cancelWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            MOCK_CANCEL_ID,
          ),
        ).resolves.toBeUndefined();

        expect(contractsDao.lockContractsById).toHaveBeenCalledWith(
          mockPrismaTx,
          MOCK_CANCEL_ID,
        );
        expect(userServicesDao.lockUserServicesById).toHaveBeenCalledWith(
          mockPrismaTx,
          mockLockedContract.userServicesId,
        );

        // 在庫戻しの確認
        expect(userServicesDao.updateUserServices).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining({
            stock: 50,
            updatedBy: MOCK_USER_ID,
          }),
        );

        // 契約数0と論理削除の確認
        expect(contractsDao.updateContracts).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining({
            quantity: 0,
            updatedBy: MOCK_USER_ID,
          }),
        );
        expect(contractsDao.softDeleteContracts).toHaveBeenCalledWith(
          mockPrismaTx,
          MOCK_CANCEL_ID,
          MOCK_TX_DATE,
          MOCK_USER_ID,
        );
      });
    });

    describe('異常系', () => {
      it('解約対象の契約が見つからない', async () => {
        contractsDao.lockContractsById.mockResolvedValue(null);

        await expect(
          service.cancelWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            MOCK_CANCEL_ID,
          ),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.cancelWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            MOCK_CANCEL_ID,
          ),
        ).rejects.toThrow('解約対象の契約が見つかりません');
      });

      it('対象のユーザー提供サービスが存在しない', async () => {
        contractsDao.lockContractsById.mockResolvedValue(mockLockedContract);
        userServicesDao.lockUserServicesById.mockResolvedValue(null);

        await expect(
          service.cancelWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            MOCK_CANCEL_ID,
          ),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.cancelWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            MOCK_CANCEL_ID,
          ),
        ).rejects.toThrow('解約対象のサービスが見つかりません');
      });
    });
  });

  describe('isValidContract', () => {
    const mockCreateRequest: ContractsCreateRequestDto = {
      userServiceId: MOCK_USER_SERVICE_ID,
      quantity: 10,
    };

    describe('正常系', () => {
      it('should return true if the service is found and stock is sufficient', async () => {
        // Setup: 在庫あり (100)
        userServicesDao.selectUserServicesById.mockResolvedValue(
          mockUserServiceRecord,
        );

        // Execute
        const result = await service.isValidContract(mockCreateRequest);

        // Assert
        expect(userServicesDao.selectUserServicesById).toHaveBeenCalledWith(
          MOCK_USER_SERVICE_ID,
        );
        expect(result).toBe(true);
      });
    });

    describe('異常系', () => {
      it('契約対象のサービスが見つからない', async () => {
        userServicesDao.selectUserServicesById.mockResolvedValue(null);

        await expect(
          service.isValidContract(mockCreateRequest),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.isValidContract(mockCreateRequest),
        ).rejects.toThrow('契約対象のサービスが見つかりません');
      });

      it('在庫不足', async () => {
        const lowStockService: UserServices = {
          ...mockUserServiceRecord,
          stock: 5,
        };
        userServicesDao.selectUserServicesById.mockResolvedValue(
          lowStockService,
        );

        await expect(
          service.isValidContract(mockCreateRequest),
        ).rejects.toThrow(BadRequestException);
        await expect(
          service.isValidContract(mockCreateRequest),
        ).rejects.toThrow('在庫が足りません');
      });
    });
  });

  describe('isValidCancel', () => {
    describe('正常系', () => {
      it('解約対象の契約とサービスが存在する', async () => {
        contractsDao.selectContractsById.mockResolvedValue(mockContractRecord);
        userServicesDao.selectUserServicesById.mockResolvedValue(
          mockUserServiceRecord,
        );

        const result = await service.isValidCancel(MOCK_CONTRACT_ID);

        expect(contractsDao.selectContractsById).toHaveBeenCalledWith(
          MOCK_CONTRACT_ID,
        );
        expect(userServicesDao.selectUserServicesById).toHaveBeenCalledWith(
          mockContractRecord.userServicesId,
        );
        expect(result).toBe(true);
      });
    });

    describe('異常系', () => {
      it('解約対象の契約が存在しない', async () => {
        contractsDao.selectContractsById.mockResolvedValue(null);

        await expect(service.isValidCancel('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.isValidCancel('non-existent-id')).rejects.toThrow(
          '解約対象の契約が見つかりません',
        );
      });

      it('契約は見つかるがサービスが見つからない', async () => {
        contractsDao.selectContractsById.mockResolvedValue(mockContractRecord);
        userServicesDao.selectUserServicesById.mockResolvedValue(null);

        await expect(service.isValidCancel(MOCK_CONTRACT_ID)).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.isValidCancel(MOCK_CONTRACT_ID)).rejects.toThrow(
          '解約対象のサービスが見つかりません',
        );
      });
    });
  });
});
