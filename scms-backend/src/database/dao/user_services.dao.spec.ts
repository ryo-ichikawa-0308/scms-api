/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SelectUserServicesDto,
  CreateUserServicesDto,
} from 'src/database/dto/user_services.dto';
import { PrismaTransaction } from 'src/prisma/prisma.service';
import {
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UserServices } from '@prisma/client';

// ユーザー提供サービスのモック
const mockUserServices: UserServices[] = [
  {
    id: 'uuid-usv-1',
    usersId: 'user-a',
    servicesId: 'svc-x',
    stock: 10,
    registeredAt: new Date(),
    registeredBy: 'system',
    updatedAt: null,
    updatedBy: null,
    isDeleted: false,
  },
  {
    id: 'uuid-usv-2',
    usersId: 'user-b',
    servicesId: 'svc-y',
    stock: 5,
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
  userServices: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockUserServicesTxModel = mockPrismaService.userServices;
const mockPrismaTx = {
  userServices: mockUserServicesTxModel,
} as unknown as PrismaTransaction;

const { PrismaClientKnownRequestError } = jest.requireActual('@prisma/client');
const mockPrismaError = (code: string) => {
  return new PrismaClientKnownRequestError(`Mock error for code ${code}`, {
    code: code,
    clientVersion: 'test-version',
    meta: {
      // P2002 (一意制約違反) のターゲットを指定
      target: code === 'P2002' ? ['usersId', 'servicesId'] : undefined,
    },
  } as any);
};

describe('UserServicesDaoのテスト', () => {
  let dao: UserServicesDao;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserServicesDao,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    dao = module.get<UserServicesDao>(UserServicesDao);
    jest.clearAllMocks();
  });

  describe('selectUserServicesのテスト', () => {
    const dto = new SelectUserServicesDto();
    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'findMany')
          .mockResolvedValueOnce([mockUserServices[0]]);
        const result = await dao.selectUserServices({ usersId: 'user-a' });
        expect(result.length).toBe(1);
        expect(mockUserServicesTxModel.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: false, usersId: 'user-a' },
          }),
        );
      });
      test('0件の結果が返る場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'findMany')
          .mockResolvedValueOnce([]);
        const result = await dao.selectUserServices({ usersId: 'notfound' });
        expect(result.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'findMany')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(dao.selectUserServices(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countUserServicesのテスト', () => {
    const dto = new SelectUserServicesDto();
    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(mockUserServicesTxModel, 'count').mockResolvedValueOnce(1);
        const result = await dao.countUserServices(dto);
        expect(result).toBe(1);
      });
      test('0が返る場合', async () => {
        jest.spyOn(mockUserServicesTxModel, 'count').mockResolvedValueOnce(0);
        const result = await dao.countUserServices(dto);
        expect(result).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'count')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(dao.countUserServices(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  const createDto: CreateUserServicesDto = {
    usersId: 'user-c',
    servicesId: 'svc-z',
    stock: 20,
    registeredAt: new Date().toISOString(),
    registeredBy: 'user',
    isDeleted: false,
  };

  describe('createUserServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        const createdService = {
          ...mockUserServices[0],
          id: 'uuid-new',
          usersId: createDto.usersId,
        };
        jest
          .spyOn(mockUserServicesTxModel, 'create')
          .mockResolvedValueOnce(createdService);
        const result = await dao.createUserServices(
          mockPrismaTx as any,
          createDto,
        );
        expect(result.usersId).toBe(createDto.usersId);
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));
        await expect(
          dao.createUserServices(mockPrismaTx as any, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.createUserServices(mockPrismaTx as any, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'create')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.createUserServices(mockPrismaTx as any, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  const updateData: UserServices = { ...mockUserServices[0], stock: 15 };

  describe('updateUserServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'update')
          .mockResolvedValueOnce(updateData);
        const result = await dao.updateUserServices(
          mockPrismaTx as any,
          updateData,
        );
        expect(result.stock).toBe(15);
      });
    });
    describe('異常系', () => {
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.updateUserServices(mockPrismaTx as any, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'update')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.updateUserServices(mockPrismaTx as any, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('softDeleteUserServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に論理削除ができる場合', async () => {
        const softDeletedService = { ...mockUserServices[0], isDeleted: true };
        jest
          .spyOn(mockUserServicesTxModel, 'update')
          .mockResolvedValueOnce(softDeletedService);
        const result = await dao.softDeleteUserServices(
          mockPrismaTx as any,
          'uuid-usv-1',
        );
        expect(result.isDeleted).toBe(true);
      });
    });
    describe('異常系', () => {
      test('論理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.softDeleteUserServices(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe('hardDeleteUserServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'delete')
          .mockResolvedValueOnce(mockUserServices[0]);
        const result = await dao.hardDeleteUserServices(
          mockPrismaTx as any,
          'uuid-usv-1',
        );
        expect(result.id).toBe('uuid-usv-1');
      });
    });
    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.hardDeleteUserServices(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesTxModel, 'delete')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.hardDeleteUserServices(mockPrismaTx as any, 'uuid-usv-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
