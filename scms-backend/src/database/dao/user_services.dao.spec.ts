/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SelectUserServicesDto,
  CreateUserServicesDto,
  UserServicesDetailDto,
} from 'src/database/dto/user_services.dto';
import { UserServices } from '@prisma/client';
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
  $queryRaw: jest.fn(),
  userServices: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockUserServicesModel = mockPrismaService.userServices;
const mockPrismaTx = {
  userServices: mockUserServicesModel,
  $queryRaw: mockPrismaService.$queryRaw,
} as unknown as PrismaTransaction;

const { PrismaClientKnownRequestError } = jest.requireActual(
  '@prisma/client/runtime/library',
);
const mockPrismaError = (code: string, target?: string[]) => {
  return new PrismaClientKnownRequestError(`Mock error for code ${code}`, {
    code: code,
    clientVersion: 'test-version',
    meta: {
      target:
        target || (code === 'P2002' ? ['usersId', 'servicesId'] : undefined),
    },
  } as any);
};

describe('UserServicesDaoのテスト', () => {
  let dao: UserServicesDao;

  const MOCK_UUID = '12345678-1234-5678-1234-567812345678';
  const MOCK_USER_ID = 'user-12345678-1234-5678-1234-567812345678';
  const MOCK_SERVICE_ID = 'service-12345678-1234-5678-1234-567812345678';
  const MOCK_SERVICE_NAME = 'テストサービス';

  const mockUserServices: UserServices = {
    id: MOCK_UUID,
    usersId: MOCK_USER_ID,
    servicesId: MOCK_SERVICE_ID,
    stock: 5,
    registeredAt: new Date(),
    registeredBy: MOCK_UUID,
    updatedAt: new Date(),
    updatedBy: MOCK_UUID,
    isDeleted: false,
  };
  const mockUserServicesDetail: UserServicesDetailDto = {
    ...mockUserServices,
    users: { id: MOCK_USER_ID, name: 'User Name' } as any, // 簡略化したモック
    services: { id: MOCK_SERVICE_ID, name: MOCK_SERVICE_NAME } as any, // 簡略化したモック
  };

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

  describe('selectUserServicesByIdsのテスト', () => {
    describe('正常系', () => {
      test('ID組み合わせでユーザー提供サービスが取得できる場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'findFirst')
          .mockResolvedValueOnce(mockUserServicesDetail);

        const result = await dao.selectUserServicesByIds(
          MOCK_USER_ID,
          MOCK_SERVICE_ID,
        );

        expect(result).toEqual(mockUserServicesDetail);
        expect(mockUserServicesModel.findFirst).toHaveBeenCalledWith({
          where: {
            usersId: MOCK_USER_ID,
            servicesId: MOCK_SERVICE_ID,
            isDeleted: false,
          },
          include: { users: true, services: true },
        });
      });

      test('ID組み合わせに一致するレコードが見つからない場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'findFirst')
          .mockResolvedValueOnce(null);

        const result = await dao.selectUserServicesByIds(
          'not-exist-user',
          'not-exist-service',
        );

        expect(result).toBeNull();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'findFirst')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.selectUserServicesByIds(MOCK_USER_ID, MOCK_SERVICE_ID),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('selectUserServicesByIdのテスト', () => {
    describe('正常系', () => {
      test('IDでユーザー提供サービスが取得できる場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'findFirst')
          .mockResolvedValueOnce(mockUserServicesDetail);

        const result = await dao.selectUserServicesById(MOCK_UUID);

        expect(result).toEqual(mockUserServicesDetail);
        expect(mockUserServicesModel.findFirst).toHaveBeenCalledWith({
          where: { id: MOCK_UUID, isDeleted: false },
          include: { users: true, services: true },
        });
      });

      test('IDに一致するレコードが見つからない場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'findFirst')
          .mockResolvedValueOnce(null);

        const result = await dao.selectUserServicesById('not-exist-id');

        expect(result).toBeNull();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'findFirst')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectUserServicesById(MOCK_UUID)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('lockUserServicesByIdのテスト', () => {
    describe('正常系', () => {
      test('IDでユーザー提供サービスレコードがロックできる場合', async () => {
        // $queryRawの返り値は、UserServices型の一部プロパティを持つ配列
        const lockedRecord: UserServices[] = [
          { ...mockUserServices, id: MOCK_UUID, stock: 5 } as UserServices,
        ];
        jest
          .spyOn(mockPrismaService, '$queryRaw')
          .mockResolvedValueOnce(lockedRecord);

        const result = await dao.lockUserServicesById(mockPrismaTx, MOCK_UUID);

        expect(result).toEqual(lockedRecord[0]);
        // $queryRawが呼び出されていることを確認（クエリの内容までは確認しない）
        expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      });
      test('ロック対象のレコードが見つからない場合、undefinedが返る', async () => {
        // $queryRawが空配列を返した場合
        jest.spyOn(mockPrismaService, '$queryRaw').mockResolvedValueOnce([]);

        const result = await dao.lockUserServicesById(
          mockPrismaTx,
          'not-exist',
        );

        expect(result).toBeUndefined();
        expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockPrismaService, '$queryRaw')
          .mockRejectedValueOnce(new Error('DB Lock Error'));

        await expect(
          dao.lockUserServicesById(mockPrismaTx, MOCK_UUID),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('selectUserServicesのテスト', () => {
    const selectDto = new SelectUserServicesDto();
    selectDto.servicesName = MOCK_SERVICE_NAME;

    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        const result: UserServices[] = [{ ...mockUserServices, stock: 10 }];
        jest
          .spyOn(mockUserServicesModel, 'findMany')
          .mockResolvedValueOnce(result);

        const userServices = await dao.selectUserServices(selectDto);

        expect(userServices).toEqual(result);
        expect(mockUserServicesModel.findMany).toHaveBeenCalledWith({
          where: {
            isDeleted: false,
            services: { name: { contains: MOCK_SERVICE_NAME } },
          },
          include: {
            services: true,
            users: true,
          },
          skip: undefined,
          take: undefined,
          orderBy: {},
        });
      });
      test('複数件の結果が返る場合', async () => {
        const result: UserServices[] = [
          { ...mockUserServices, stock: 10 },
          { ...mockUserServices, id: '2', stock: 20 },
        ];
        jest
          .spyOn(mockUserServicesModel, 'findMany')
          .mockResolvedValueOnce(result);
        selectDto.limit = 10;
        selectDto.sortBy = 'stock';
        selectDto.sortOrder = 'asc';

        const userServices = await dao.selectUserServices(selectDto);

        expect(userServices).toEqual(result);
        expect(mockUserServicesModel.findMany).toHaveBeenCalledWith({
          where: {
            isDeleted: false,
            services: { name: { contains: MOCK_SERVICE_NAME } },
          },
          include: {
            services: true,
            users: true,
          },
          skip: undefined,
          take: 10,
          orderBy: { stock: 'asc' },
        });
        selectDto.limit = undefined;
        selectDto.sortBy = undefined;
        selectDto.sortOrder = undefined;
      });
      test('0件の結果が返る場合', async () => {
        const result: UserServices[] = [];
        jest
          .spyOn(mockUserServicesModel, 'findMany')
          .mockResolvedValueOnce(result);

        const userServices = await dao.selectUserServices(selectDto);

        expect(userServices).toEqual([]);
        expect(mockUserServicesModel.findMany).toHaveBeenCalledWith({
          where: {
            isDeleted: false,
            services: { name: { contains: MOCK_SERVICE_NAME } },
          },
          include: {
            services: true,
            users: true,
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
          .spyOn(mockUserServicesModel, 'findMany')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectUserServices(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countUserServicesのテスト', () => {
    const selectDto = new SelectUserServicesDto();
    selectDto.servicesName = MOCK_SERVICE_NAME;

    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(mockUserServicesModel, 'count').mockResolvedValueOnce(1);

        const count = await dao.countUserServices(selectDto);

        expect(count).toBe(1);
        expect(mockUserServicesModel.count).toHaveBeenCalledWith({
          where: {
            isDeleted: false,
            services: { name: { contains: MOCK_SERVICE_NAME } },
          },
        });
      });
      test('2以上が返る場合', async () => {
        jest.spyOn(mockUserServicesModel, 'count').mockResolvedValueOnce(5);

        const count = await dao.countUserServices(selectDto);

        expect(count).toBe(5);
      });
      test('0が返る場合', async () => {
        jest.spyOn(mockUserServicesModel, 'count').mockResolvedValueOnce(0);

        const count = await dao.countUserServices(selectDto);

        expect(count).toBe(0);
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'count')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.countUserServices(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('createUserServicesのテスト', () => {
    const createDto: CreateUserServicesDto = {
      usersId: MOCK_USER_ID,
      servicesId: MOCK_SERVICE_ID,
      stock: 10,
      registeredBy: MOCK_UUID,
    };
    const createdUserServices: UserServices = {
      ...mockUserServices,
      ...createDto,
      id: 'new-id',
      updatedAt: null,
      updatedBy: null,
    };

    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'create')
          .mockResolvedValueOnce(createdUserServices);

        const userServices = await dao.createUserServices(
          mockPrismaTx,
          createDto,
        );

        expect(userServices).toEqual(createdUserServices);
        expect(mockUserServicesModel.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            stock: createDto.stock,
            users: { connect: { id: createDto.usersId } },
            services: { connect: { id: createDto.servicesId } },
          }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(
          dao.createUserServices(mockPrismaTx, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.createUserServices(mockPrismaTx, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'create')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.createUserServices(mockPrismaTx, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('updateUserServicesのテスト', () => {
    const updateData: UserServices = {
      ...mockUserServices,
      stock: 20,
      updatedAt: new Date(),
      updatedBy: 'updater-id',
    };

    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'update')
          .mockResolvedValueOnce(updateData);

        const userServices = await dao.updateUserServices(
          mockPrismaTx,
          updateData,
        );

        expect(userServices).toEqual(updateData);
        expect(mockUserServicesModel.update).toHaveBeenCalledWith({
          where: { id: updateData.id },
          data: expect.objectContaining({
            stock: updateData.stock,
          }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(
          dao.updateUserServices(mockPrismaTx, updateData),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.updateUserServices(mockPrismaTx, updateData),
        ).rejects.toThrow(BadRequestException);
      });
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.updateUserServices(mockPrismaTx, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUserServicesModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.updateUserServices(mockPrismaTx, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
