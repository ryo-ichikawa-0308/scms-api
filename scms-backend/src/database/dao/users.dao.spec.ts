/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersDao } from 'src/database/dao/users.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import { SelectUsersDto, CreateUsersDto } from 'src/database/dto/users.dto';
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
  users: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockUsersModel = mockPrismaService.users;
const mockPrismaTx = {
  users: mockUsersModel,
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

  describe('selectUsersのテスト', () => {
    const selectDto = new SelectUsersDto();
    selectDto.id = MOCK_UUID;

    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        const result: Users[] = [{ ...mockUser, name: 'User 1' }];
        jest.spyOn(mockUsersModel, 'findMany').mockResolvedValueOnce(result);

        const users = await dao.selectUsers(selectDto);

        expect(users).toEqual(result);
        expect(mockUsersModel.findMany).toHaveBeenCalledWith({
          where: { isDeleted: false, id: { contains: MOCK_UUID } },
          skip: undefined,
          take: undefined,
          orderBy: {},
        });
      });
      test('複数件の結果が返る場合', async () => {
        const result: Users[] = [
          { ...mockUser, name: 'User 1' },
          { ...mockUser, id: '2', name: 'User 2' },
        ];
        jest.spyOn(mockUsersModel, 'findMany').mockResolvedValueOnce(result);
        selectDto.limit = 10;
        selectDto.sortBy = 'name';
        selectDto.sortOrder = 'desc';

        const users = await dao.selectUsers(selectDto);

        expect(users).toEqual(result);
        expect(mockUsersModel.findMany).toHaveBeenCalledWith({
          where: { isDeleted: false, id: { contains: MOCK_UUID } },
          skip: undefined,
          take: 10,
          orderBy: { name: 'desc' },
        });
        selectDto.limit = undefined;
        selectDto.sortBy = undefined;
        selectDto.sortOrder = undefined;
      });
      test('0件の結果が返る場合', async () => {
        const result: Users[] = [];
        jest.spyOn(mockUsersModel, 'findMany').mockResolvedValueOnce(result);

        const users = await dao.selectUsers(new SelectUsersDto());

        expect(users).toEqual([]);
        expect(mockUsersModel.findMany).toHaveBeenCalledWith({
          where: { isDeleted: false },
          skip: undefined,
          take: undefined,
          orderBy: {},
        });
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'findMany')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectUsers(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countUsersのテスト', () => {
    const selectDto = new SelectUsersDto();
    selectDto.name = 'Test';

    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(mockUsersModel, 'count').mockResolvedValueOnce(1);

        const count = await dao.countUsers(selectDto);

        expect(count).toBe(1);
        expect(mockUsersModel.count).toHaveBeenCalledWith({
          where: { isDeleted: false, name: { contains: 'Test' } },
        });
      });
      test('2以上が返る場合', async () => {
        jest.spyOn(mockUsersModel, 'count').mockResolvedValueOnce(5);

        const count = await dao.countUsers(selectDto);

        expect(count).toBe(5);
      });
      test('0が返る場合', async () => {
        jest.spyOn(mockUsersModel, 'count').mockResolvedValueOnce(0);

        const count = await dao.countUsers(selectDto);

        expect(count).toBe(0);
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'count')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.countUsers(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
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

  describe('softDeleteUsersのテスト', () => {
    const deleteId = MOCK_UUID;
    const updatedAt = new Date();
    const updatedBy = 'deleter-id';
    const softDeletedUser: Users = {
      ...mockUser,
      id: deleteId,
      isDeleted: true,
      updatedAt,
      updatedBy,
    };

    describe('正常系', () => {
      test('対象レコードが論理削除されていない場合', async () => {
        jest
          .spyOn(mockUsersModel, 'update')
          .mockResolvedValueOnce(softDeletedUser);

        const user = await dao.softDeleteUsers(
          mockPrismaTx,
          deleteId,
          updatedAt,
          updatedBy,
        );

        expect(user).toEqual(softDeletedUser);
        expect(mockUsersModel.update).toHaveBeenCalledWith({
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
          .spyOn(mockUsersModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.softDeleteUsers(mockPrismaTx, deleteId, updatedAt, updatedBy),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.softDeleteUsers(mockPrismaTx, deleteId, updatedAt, updatedBy),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('hardDeleteUsersのテスト', () => {
    const deleteId = MOCK_UUID;

    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        jest.spyOn(mockUsersModel, 'delete').mockResolvedValueOnce(mockUser);

        const user = await dao.hardDeleteUsers(mockPrismaTx, deleteId);

        expect(user).toEqual(mockUser);
        expect(mockUsersModel.delete).toHaveBeenCalledWith({
          where: { id: deleteId },
        });
      });
    });

    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUsersModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.hardDeleteUsers(mockPrismaTx, deleteId),
        ).rejects.toThrow(NotFoundException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.hardDeleteUsers(mockPrismaTx, deleteId),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersModel, 'delete')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.hardDeleteUsers(mockPrismaTx, deleteId),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
