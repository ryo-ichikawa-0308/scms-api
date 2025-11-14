/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersDao } from 'src/database/dao/users.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUsersDto } from 'src/database/dto/users.dto';
import { Users } from '@prisma/client';
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
  users: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockUsersModel = mockPrismaService.users;
const mockPrismaTx = {
  users: mockUsersModel,
  $queryRaw: mockPrismaService.$queryRaw,
} as unknown as PrismaTransaction;

const { PrismaClientKnownRequestError } = jest.requireActual(
  '@prisma/client/runtime/library',
);
const mockPrismaError = (code: string) => {
  return new PrismaClientKnownRequestError(`Mock error for code ${code}`, {
    code: code,
    clientVersion: 'test-version',
    meta: {
      target: code === 'P2002' ? ['email'] : undefined,
    },
  } as any);
};

describe('UsersDaoのテスト', () => {
  let dao: UsersDao;

  const MOCK_UUID = '12345678-1234-5678-1234-567812345678';
  const mockUser: Users = {
    id: MOCK_UUID,
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    token: 'token123',
    registeredAt: new Date(),
    registeredBy: MOCK_UUID,
    updatedAt: new Date(),
    updatedBy: MOCK_UUID,
    isDeleted: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersDao,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    dao = module.get<UsersDao>(UsersDao);
    jest.clearAllMocks();
  });

  describe('selectUsersByIdのテスト', () => {
    describe('正常系', () => {
      test('IDでユーザーが取得できる場合', async () => {
        jest.spyOn(mockUsersModel, 'findFirst').mockResolvedValueOnce(mockUser);

        const user = await dao.selectUsersById(MOCK_UUID);

        expect(user).toEqual(mockUser);
        expect(mockUsersModel.findFirst).toHaveBeenCalledWith({
          where: { id: MOCK_UUID, isDeleted: false },
        });
      });

      test('IDに一致するユーザーが見つからない場合', async () => {
        jest.spyOn(mockUsersModel, 'findFirst').mockResolvedValueOnce(null);

        const user = await dao.selectUsersById(MOCK_UUID);

        expect(user).toBeNull();
        expect(mockUsersModel.findFirst).toHaveBeenCalledWith({
          where: { id: MOCK_UUID, isDeleted: false },
        });
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'findFirst')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectUsersById(MOCK_UUID)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('selectUsersByEmailのテスト', () => {
    describe('正常系', () => {
      test('メールアドレスでユーザーが取得できる場合', async () => {
        jest.spyOn(mockUsersModel, 'findFirst').mockResolvedValueOnce(mockUser);

        const user = await dao.selectUsersByEmail(mockUser.email);

        expect(user).toEqual(mockUser);
        expect(mockUsersModel.findFirst).toHaveBeenCalledWith({
          where: { email: mockUser.email, isDeleted: false },
        });
      });

      test('メールアドレスに一致するユーザーが見つからない場合', async () => {
        jest.spyOn(mockUsersModel, 'findFirst').mockResolvedValueOnce(null);

        const user = await dao.selectUsersByEmail('notfound@example.com');

        expect(user).toBeNull();
        expect(mockUsersModel.findFirst).toHaveBeenCalledWith({
          where: { email: 'notfound@example.com', isDeleted: false },
        });
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'findFirst')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectUsersByEmail(mockUser.email)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('lockUsersByIdのテスト', () => {
    describe('正常系', () => {
      test('IDでユーザーレコードがロックできる場合', async () => {
        const lockedRecord: Users[] = [mockUser];
        jest
          .spyOn(mockPrismaService, '$queryRaw')
          .mockResolvedValueOnce(lockedRecord);

        const user = await dao.lockUsersById(mockPrismaTx, MOCK_UUID);

        expect(user).toEqual(mockUser);
        expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
      });
      test('ロック対象のユーザーレコードが見つからない場合undefinedが返ること', async () => {
        jest.spyOn(mockPrismaService, '$queryRaw').mockResolvedValueOnce([]);
        const user = await dao.lockUsersById(mockPrismaTx, MOCK_UUID);
        expect(user).toBeUndefined();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockPrismaService, '$queryRaw')
          .mockRejectedValueOnce(new Error('DB Error'));
        await expect(
          dao.lockUsersById(mockPrismaTx, MOCK_UUID),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('createUsersのテスト', () => {
    const createDto: CreateUsersDto = {
      name: 'New User',
      email: 'new@example.com',
      password: 'newpassword',
      registeredBy: MOCK_UUID,
    };
    const createdUser: Users = {
      ...mockUser,
      ...createDto,
      id: 'new-id',
      updatedAt: null,
      updatedBy: null,
    };

    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        jest.spyOn(mockUsersModel, 'create').mockResolvedValueOnce(createdUser);

        const user = await dao.createUsers(mockPrismaTx, createDto);

        expect(user).toEqual(createdUser);
        expect(mockUsersModel.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: createDto.name,
            email: createDto.email,
          }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(dao.createUsers(mockPrismaTx, createDto)).rejects.toThrow(
          ConflictException,
        );
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(dao.createUsers(mockPrismaTx, createDto)).rejects.toThrow(
          BadRequestException,
        );
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'create')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.createUsers(mockPrismaTx, createDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('updateUsersのテスト', () => {
    const updateData: Users = {
      ...mockUser,
      name: 'Updated Name',
      updatedAt: new Date(),
      updatedBy: 'updater-id',
    };

    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest.spyOn(mockUsersModel, 'update').mockResolvedValueOnce(updateData);

        const user = await dao.updateUsers(mockPrismaTx, updateData);

        expect(user).toEqual(updateData);
        expect(mockUsersModel.update).toHaveBeenCalledWith({
          where: { id: updateData.id },
          data: expect.objectContaining({ name: updateData.name }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(dao.updateUsers(mockPrismaTx, updateData)).rejects.toThrow(
          ConflictException,
        );
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(dao.updateUsers(mockPrismaTx, updateData)).rejects.toThrow(
          BadRequestException,
        );
      });
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUsersModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(dao.updateUsers(mockPrismaTx, updateData)).rejects.toThrow(
          NotFoundException,
        );
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.updateUsers(mockPrismaTx, updateData)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });
});
