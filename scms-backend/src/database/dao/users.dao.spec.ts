/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersDao } from 'src/database/dao/users.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import { SelectUsersDto, CreateUsersDto } from 'src/database/dto/users.dto';
import { PrismaTransaction } from 'src/prisma/prisma.service';
import {
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Users } from '@prisma/client';

// モックPrismaServiceのコアデータ
const mockUsers: Users[] = [
  {
    id: 'uuid-1',
    name: 'Active User 1',
    email: 'user1@example.com',
    password: 'hash1',
    registeredAt: new Date(),
    registeredBy: 'system',
    updatedAt: null,
    updatedBy: null,
    isDeleted: false,
  },
  {
    id: 'uuid-2',
    name: 'Deleted User',
    email: 'user2@example.com',
    password: 'hash2',
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
  users: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockUsersTxModel = mockPrismaService.users;
const mockPrismaTx = {
  users: mockUsersTxModel,
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

describe('UsersDaoのテスト', () => {
  let dao: UsersDao;
  let prismaService: typeof mockPrismaService;

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
    prismaService = module.get(PrismaService);

    jest.clearAllMocks();
  });

  // ----------------------------------------------------
  // selectUsersのテスト
  // ----------------------------------------------------
  describe('selectUsersのテスト', () => {
    const dto = new SelectUsersDto();
    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        jest
          .spyOn(prismaService.users, 'findMany')
          .mockResolvedValueOnce([mockUsers[0]]);

        // DAOメソッドの呼び出し
        const result = await dao.selectUsers({ id: 'uuid-1' });

        expect(result.length).toBe(1);
        expect(prismaService.users.findMany).toHaveBeenCalledWith(
          // prismaService (モック)を使用
          expect.objectContaining({
            where: { isDeleted: false, id: 'uuid-1' },
          }),
        );
      });
      test('複数件の結果が返る場合', async () => {
        jest
          .spyOn(prismaService.users, 'findMany')
          .mockResolvedValueOnce(
            [mockUsers[0], mockUsers[1]].filter((u) => u.isDeleted === false),
          );
        const result = await dao.selectUsers({});
        expect(result.length).toBe(1); // 削除フラグでフィルタリングされるため
        expect(prismaService.users.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: false },
          }),
        );
      });
      test('0件の結果が返る場合', async () => {
        jest.spyOn(prismaService.users, 'findMany').mockResolvedValueOnce([]);
        const result = await dao.selectUsers({ name: 'notfound' });
        expect(result.length).toBe(0);
        expect(prismaService.users.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: false, name: { contains: 'notfound' } },
          }),
        );
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(prismaService.users, 'findMany')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(dao.selectUsers(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  // ----------------------------------------------------
  // countUsersのテスト
  // ----------------------------------------------------
  describe('countUsersのテスト', () => {
    const dto = new SelectUsersDto();
    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(prismaService.users, 'count').mockResolvedValueOnce(1);
        const result = await dao.countUsers({ name: 'Active' });
        expect(result).toBe(1);
        expect(prismaService.users.count).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: false, name: { contains: 'Active' } },
          }),
        );
      });
      test('2以上が返る場合', async () => {
        jest.spyOn(prismaService.users, 'count').mockResolvedValueOnce(5);
        const result = await dao.countUsers(dto);
        expect(result).toBe(5);
      });
      test('0が返る場合', async () => {
        jest.spyOn(prismaService.users, 'count').mockResolvedValueOnce(0);
        const result = await dao.countUsers(dto);
        expect(result).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(prismaService.users, 'count')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(dao.countUsers(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  // ----------------------------------------------------
  // createUsersのテスト
  // ----------------------------------------------------
  const createDto: CreateUsersDto = {
    name: 'New User',
    email: 'new@example.com',
    password: 'new-hash',
    registeredAt: new Date().toISOString(),
    registeredBy: 'user',
    isDeleted: false,
  };

  describe('createUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        const createdUser = {
          ...mockUsers[0],
          id: 'uuid-new',
          email: createDto.email,
        };
        jest
          .spyOn(mockUsersTxModel, 'create')
          .mockResolvedValueOnce(createdUser);

        // DAOメソッドの呼び出し
        const result = await dao.createUsers(mockPrismaTx as any, createDto);
        expect(result.email).toBe(createDto.email);
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));
        await expect(
          dao.createUsers(mockPrismaTx as any, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.createUsers(mockPrismaTx as any, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'create')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.createUsers(mockPrismaTx as any, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  // ----------------------------------------------------
  // updateUsersのテスト
  // ----------------------------------------------------
  const updateData: Users = { ...mockUsers[0], name: 'Updated Name' };

  describe('updateUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockResolvedValueOnce(updateData);
        const result = await dao.updateUsers(mockPrismaTx as any, updateData);
        expect(result.name).toBe('Updated Name');
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2002'));
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        // updateでもP2003のチェックは必要
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(BadRequestException);
      });
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  // ----------------------------------------------------
  // softDeleteUsersのテスト
  // ----------------------------------------------------
  describe('softDeleteUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に論理削除ができる場合', async () => {
        const softDeletedUser = { ...mockUsers[0], isDeleted: true };
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockResolvedValueOnce(softDeletedUser);
        const result = await dao.softDeleteUsers(mockPrismaTx as any, 'uuid-1');
        // 【修正】isDeletedはBooleanなのでtrueと比較
        expect(result.isDeleted).toBe(true);
      });
    });
    describe('異常系', () => {
      test('論理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.softDeleteUsers(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'update')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.softDeleteUsers(mockPrismaTx as any, 'uuid-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  // ----------------------------------------------------
  // hardDeleteUsersのテスト
  // ----------------------------------------------------
  describe('hardDeleteUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        // 【修正】物理削除成功はResolvedValueを使用
        jest
          .spyOn(mockUsersTxModel, 'delete')
          .mockResolvedValueOnce(mockUsers[0]);
        const result = await dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-1');
        expect(result.id).toBe('uuid-1');
      });
    });
    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-1'),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockUsersTxModel, 'delete')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
