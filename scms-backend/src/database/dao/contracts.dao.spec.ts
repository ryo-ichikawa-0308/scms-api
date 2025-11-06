/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsDao } from 'src/database/dao/contracts.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SelectContractsDto,
  CreateContractsDto,
} from 'src/database/dto/contracts.dto';
import { PrismaTransaction } from 'src/prisma/prisma.service';
import {
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Contracts } from '@prisma/client';

// 契約情報のモック
const mockContracts: Contracts[] = [
  {
    id: 'uuid-con-1',
    usersId: 'user-a',
    userServicesId: 'usv-x',
    quantity: 10,
    registeredAt: new Date(),
    registeredBy: 'system',
    updatedAt: null,
    updatedBy: null,
    isDeleted: false,
  },
  {
    id: 'uuid-con-2',
    usersId: 'user-b',
    userServicesId: 'usv-y',
    quantity: 5,
    registeredAt: new Date(),
    registeredBy: 'system',
    updatedAt: null,
    updatedBy: null,
    isDeleted: true,
  },
];

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
  },
};

const mockContractsTxModel = mockPrismaService.contracts;
const mockPrismaTx = {
  contracts: mockContractsTxModel,
} as unknown as PrismaTransaction;

const { PrismaClientKnownRequestError } = jest.requireActual('@prisma/client');
const mockPrismaError = (code: string) => {
  return new PrismaClientKnownRequestError(`Mock error for code ${code}`, {
    code: code,
    clientVersion: 'test-version',
    meta: {
      target: code === 'P2002' ? ['email'] : undefined,
    },
  } as any);
};

describe('ContractsDaoのテスト', () => {
  let dao: ContractsDao;

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

  describe('selectContractsのテスト', () => {
    const dto = new SelectContractsDto();
    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        mockPrismaService.contracts.findMany.mockResolvedValueOnce([
          mockContracts[0],
        ]);
        const result = await dao.selectContracts({ id: 'uuid-con-1' });
        expect(result.length).toBe(1);
        expect(mockPrismaService.contracts.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: false, id: 'uuid-con-1' },
          }),
        );
      });
      test('0件の結果が返る場合', async () => {
        mockPrismaService.contracts.findMany.mockResolvedValueOnce([]);
        const result = await dao.selectContracts({ usersId: 'notfound' });
        expect(result.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaService.contracts.findMany.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(dao.selectContracts(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countContractsのテスト', () => {
    const dto = new SelectContractsDto();
    describe('正常系', () => {
      test('1が返る場合', async () => {
        mockPrismaService.contracts.count.mockResolvedValueOnce(1);
        const result = await dao.countContracts(dto);
        expect(result).toBe(1);
      });
      test('0が返る場合', async () => {
        mockPrismaService.contracts.count.mockResolvedValueOnce(0);
        const result = await dao.countContracts(dto);
        expect(result).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaService.contracts.count.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(dao.countContracts(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  const createDto: CreateContractsDto = {
    usersId: 'user-c',
    userServicesId: 'usv-z',
    quantity: 20,
    registeredAt: new Date().toISOString(),
    registeredBy: 'user',
    isDeleted: false,
  };

  describe('createContractsのテスト', () => {
    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        const createdContract = {
          ...mockContracts[0],
          id: 'uuid-new',
          usersId: createDto.usersId,
        };
        jest
          .spyOn(mockContractsTxModel, 'create')
          .mockResolvedValueOnce(createdContract);
        const result = await dao.createContracts(
          mockPrismaTx as any,
          createDto,
        );
        expect(result.usersId).toBe(createDto.usersId);
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));
        await expect(
          dao.createContracts(mockPrismaTx as any, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.createContracts(mockPrismaTx as any, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'create')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.createContracts(mockPrismaTx as any, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  const updateData: Contracts = { ...mockContracts[0], quantity: 15 };

  describe('updateContractsのテスト', () => {
    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'update')
          .mockResolvedValueOnce(updateData);
        const result = await dao.updateContracts(
          mockPrismaTx as any,
          updateData,
        );
        expect(result.quantity).toBe(15);
      });
    });
    describe('異常系', () => {
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.updateContracts(mockPrismaTx as any, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'update')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.updateContracts(mockPrismaTx as any, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('softDeleteContractsのテスト', () => {
    describe('正常系', () => {
      test('正常に論理削除ができる場合', async () => {
        const softDeletedContract = { ...mockContracts[0], isDeleted: true };
        jest
          .spyOn(mockContractsTxModel, 'update')
          .mockResolvedValueOnce(softDeletedContract);
        const result = await dao.softDeleteContracts(
          mockPrismaTx as any,
          'uuid-con-1',
        );
        expect(result.isDeleted).toBe(true);
      });
    });
    describe('異常系', () => {
      test('論理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.softDeleteContracts(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('hardDeleteContractsのテスト', () => {
    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'delete')
          .mockResolvedValueOnce(mockContracts[0]);
        const result = await dao.hardDeleteContracts(
          mockPrismaTx as any,
          'uuid-con-1',
        );
        expect(result.id).toBe('uuid-con-1');
      });
    });
    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.hardDeleteContracts(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockContractsTxModel, 'delete')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.hardDeleteContracts(mockPrismaTx as any, 'uuid-con-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
