/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsDao } from 'src/database/dao/contracts.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SelectContractsDto,
  CreateContractsDto,
  ContractsDetailDto,
} from 'src/database/dto/contracts.dto';
import { Contracts } from '@prisma/client';
import {
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';

// Prisma関連のモック
const mockPrismaService = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $on: jest.fn(),
  $use: jest.fn(),
  $transaction: jest.fn(),
  contracts: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockContractsModel = mockPrismaService.contracts;
const mockPrismaTx = {
  $queryRaw: jest.fn(),
  contracts: mockContractsModel,
} as unknown as PrismaTransaction;

const { PrismaClientKnownRequestError } = jest.requireActual(
  '@prisma/client/runtime/library',
);
const mockPrismaError = (code: string) => {
  return new PrismaClientKnownRequestError(`Mock error for code ${code}`, {
    code: code,
    clientVersion: 'test-version',
    meta: {
      // Contractsには複合/単一の一意制約がないためP2002のmetaは省略
    },
  } as any);
};

describe('ContractsDaoのテスト', () => {
  let dao: ContractsDao;

  const MOCK_UUID = '12345678-1234-5678-1234-567812345678';
  const MOCK_USER_ID = 'user-12345678-1234-5678-1234-567812345678';
  const MOCK_USER_SERVICE_ID = 'userv-12345678-1234-5678-1234-567812345678';
  const MOCK_SERVICE_NAME = 'テストサービス';

  const mockContract: Contracts = {
    id: MOCK_UUID,
    usersId: MOCK_USER_ID,
    userServicesId: MOCK_USER_SERVICE_ID,
    quantity: 1,
    registeredAt: new Date(),
    registeredBy: MOCK_UUID,
    updatedAt: new Date(),
    updatedBy: MOCK_UUID,
    isDeleted: false,
  };

  const mockUser = {
    id: MOCK_USER_ID,
    name: 'Test User',
  };
  const mockService = {
    id: 'service-id',
    name: 'Premium Service',
    price: 1000,
    unit: '月',
  };
  const mockUserService = {
    id: MOCK_USER_SERVICE_ID,
    usersId: MOCK_USER_ID,
    servicesId: 'service-id',
    users: mockUser,
    services: mockService,
  };
  const mockContractDetail: ContractsDetailDto = {
    ...mockContract,
    users: mockUser,
    userServices: mockUserService as any,
  } as ContractsDetailDto;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsDao,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    dao = module.get<ContractsDao>(ContractsDao);
    jest.clearAllMocks();
  });
  describe('selectContractsByIdのテスト', () => {
    const ID_TO_SEARCH = mockContract.id;

    describe('正常系', () => {
      test('契約IDでレコードが取得できる場合 (関連テーブル含む)', async () => {
        jest
          .spyOn(mockContractsModel, 'findFirst')
          .mockResolvedValueOnce(mockContractDetail);

        const result = await dao.selectContractsById(ID_TO_SEARCH);

        expect(result).toEqual(mockContractDetail);
        // PrismaのfindFirstが正しいwhere句とincludeで呼ばれたことを確認
        expect(mockContractsModel.findFirst).toHaveBeenCalledWith({
          where: {
            id: ID_TO_SEARCH,
            isDeleted: false,
          },
          include: expect.objectContaining({
            users: true,
            userServices: expect.anything(),
          }),
        });
      });

      test('契約IDに一致するレコードが見つからない場合、nullが返る', async () => {
        jest.spyOn(mockContractsModel, 'findFirst').mockResolvedValueOnce(null);

        const result = await dao.selectContractsById('non-existent-id');

        expect(result).toBeNull();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合、InternalServerErrorExceptionがスローされる', async () => {
        jest
          .spyOn(mockContractsModel, 'findFirst')
          .mockRejectedValueOnce(new Error('DB connection failed'));

        await expect(dao.selectContractsById(ID_TO_SEARCH)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('lockContractsByIdのテスト', () => {
    const ID_TO_LOCK = mockContract.id;

    describe('正常系', () => {
      test('契約IDでレコードのロックが取得できる場合', async () => {
        const lockedRecord = mockContract;
        jest
          .spyOn(mockPrismaTx, '$queryRaw')
          .mockResolvedValueOnce([lockedRecord]);
        const result = await dao.lockContractsById(mockPrismaTx, ID_TO_LOCK);
        expect(result).toEqual(lockedRecord);
        expect(mockPrismaTx.$queryRaw).toHaveBeenCalled();
      });

      test('ロック対象のレコードが見つからない場合、undefinedが返る', async () => {
        jest.spyOn(mockPrismaTx, '$queryRaw').mockResolvedValueOnce([]);
        const result = await dao.lockContractsById(mockPrismaTx, ID_TO_LOCK);
        expect(result).toBeUndefined();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合、InternalServerErrorExceptionがスローされる', async () => {
        jest
          .spyOn(mockPrismaTx, '$queryRaw')
          .mockRejectedValueOnce(new Error('DB lock failed'));

        await expect(
          dao.lockContractsById(mockPrismaTx, ID_TO_LOCK),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
  describe('selectContractsのテスト', () => {
    const selectDto = new SelectContractsDto();
    selectDto.usersId = MOCK_USER_ID;
    selectDto.serviceName = MOCK_SERVICE_NAME;

    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        const result: Contracts[] = [{ ...mockContract, quantity: 2 }];
        jest
          .spyOn(mockContractsModel, 'findMany')
          .mockResolvedValueOnce(result);

        const contracts = await dao.selectContracts(selectDto);

        expect(contracts).toEqual(result);
        expect(mockContractsModel.findMany).toHaveBeenCalledWith({
          where: {
            usersId: MOCK_USER_ID,
            isDeleted: false,
            userServices: {
              services: {
                name: { contains: MOCK_SERVICE_NAME },
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
          skip: undefined,
          take: undefined,
          orderBy: {},
        });
      });
      test('複数件の結果が返る場合', async () => {
        const result: Contracts[] = [
          { ...mockContract, quantity: 2 },
          { ...mockContract, id: '2', quantity: 3 },
        ];
        jest
          .spyOn(mockContractsModel, 'findMany')
          .mockResolvedValueOnce(result);
        selectDto.usersId = MOCK_USER_ID;
        selectDto.serviceName = MOCK_SERVICE_NAME;
        selectDto.limit = 10;
        selectDto.sortBy = 'quantity';
        selectDto.sortOrder = 'desc';

        const contracts = await dao.selectContracts(selectDto);

        expect(contracts).toEqual(result);
        expect(mockContractsModel.findMany).toHaveBeenCalledWith({
          where: {
            usersId: MOCK_USER_ID,
            isDeleted: false,
            userServices: {
              services: {
                name: { contains: MOCK_SERVICE_NAME },
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
          skip: undefined,
          take: 10,
          orderBy: { quantity: 'desc' },
        });
        selectDto.limit = undefined;
        selectDto.sortBy = undefined;
        selectDto.sortOrder = undefined;
      });
      test('0件の結果が返る場合', async () => {
        const result: Contracts[] = [];
        jest
          .spyOn(mockContractsModel, 'findMany')
          .mockResolvedValueOnce(result);

        const contracts = await dao.selectContracts(selectDto);

        expect(contracts).toEqual([]);
        expect(mockContractsModel.findMany).toHaveBeenCalledWith({
          where: {
            isDeleted: false,
            usersId: MOCK_USER_ID,
            userServices: {
              services: {
                name: { contains: MOCK_SERVICE_NAME },
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
          skip: undefined,
          take: undefined,
          orderBy: {},
        });
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'findMany')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectContracts(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countContractsのテスト', () => {
    const selectDto = new SelectContractsDto();
    selectDto.usersId = MOCK_USER_ID;
    selectDto.serviceName = MOCK_SERVICE_NAME;

    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(mockContractsModel, 'count').mockResolvedValueOnce(1);

        const count = await dao.countContracts(selectDto);

        expect(count).toBe(1);
        expect(mockContractsModel.count).toHaveBeenCalledWith({
          where: {
            usersId: MOCK_USER_ID,
            isDeleted: false,
            userServices: {
              services: {
                name: { contains: MOCK_SERVICE_NAME },
              },
            },
          },
        });
      });
      test('2以上が返る場合', async () => {
        jest.spyOn(mockContractsModel, 'count').mockResolvedValueOnce(5);

        const count = await dao.countContracts(selectDto);

        expect(count).toBe(5);
      });
      test('0が返る場合', async () => {
        jest.spyOn(mockContractsModel, 'count').mockResolvedValueOnce(0);

        const count = await dao.countContracts(selectDto);

        expect(count).toBe(0);
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'count')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.countContracts(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('createContractsのテスト', () => {
    const createDto: CreateContractsDto = {
      usersId: MOCK_USER_ID,
      userServicesId: MOCK_USER_SERVICE_ID,
      quantity: 10,
      registeredBy: MOCK_UUID,
    };
    const createdContract: Contracts = {
      ...mockContract,
      ...createDto,
      id: 'new-id',
      updatedAt: null,
      updatedBy: null,
    };

    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        jest
          .spyOn(mockContractsModel, 'create')
          .mockResolvedValueOnce(createdContract);

        const contract = await dao.createContracts(mockPrismaTx, createDto);

        expect(contract).toEqual(createdContract);
        expect(mockContractsModel.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            quantity: createDto.quantity,
            users: { connect: { id: createDto.usersId } },
            userServices: { connect: { id: createDto.userServicesId } },
          }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        // UUID衝突のレアケースを想定
        jest
          .spyOn(mockContractsModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(
          dao.createContracts(mockPrismaTx, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.createContracts(mockPrismaTx, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'create')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.createContracts(mockPrismaTx, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('updateContractsのテスト', () => {
    const updateData: Contracts = {
      ...mockContract,
      quantity: 20,
      updatedAt: new Date(),
      updatedBy: 'updater-id',
    };

    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockResolvedValueOnce(updateData);

        const contract = await dao.updateContracts(mockPrismaTx, updateData);

        expect(contract).toEqual(updateData);
        expect(mockContractsModel.update).toHaveBeenCalledWith({
          where: { id: updateData.id },
          data: expect.objectContaining({
            quantity: updateData.quantity,
          }),
        });
      });
    });

    describe('異常系', () => {
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.updateContracts(mockPrismaTx, updateData),
        ).rejects.toThrow(BadRequestException);
      });
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.updateContracts(mockPrismaTx, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.updateContracts(mockPrismaTx, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('softDeleteContractsのテスト', () => {
    const deleteId = MOCK_UUID;
    const updatedAt = new Date();
    const updatedBy = 'deleter-id';
    const softDeletedContract: Contracts = {
      ...mockContract,
      id: deleteId,
      isDeleted: true,
      updatedAt,
      updatedBy,
    };

    describe('正常系', () => {
      test('対象レコードが論理削除されていない場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockResolvedValueOnce(softDeletedContract);

        const contract = await dao.softDeleteContracts(
          mockPrismaTx,
          deleteId,
          updatedAt,
          updatedBy,
        );

        expect(contract).toEqual(softDeletedContract);
        expect(mockContractsModel.update).toHaveBeenCalledWith({
          where: { id: deleteId },
          data: {
            isDeleted: true,
            updatedAt,
            updatedBy,
          },
        });
      });
    });

    describe('異常系', () => {
      test('論理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.softDeleteContracts(mockPrismaTx, deleteId, updatedAt, updatedBy),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.softDeleteContracts(mockPrismaTx, deleteId, updatedAt, updatedBy),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
