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

// モックPrismaService
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
    isDeleted: 0,
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
    isDeleted: 1,
  },
];

const mockPrismaService = {
  users: {
    findMany: jest.fn().mockImplementation((options) => {
      let filtered = mockUsers.filter((u) => u.isDeleted === 0);
      if (options.where.name?.contains) {
        filtered = filtered.filter((u) =>
          u.name.includes(options.where.name.contains),
        );
      }
      if (options.where.id) {
        filtered = filtered.filter((u) => u.id === options.where.id);
      }
      return Promise.resolve(
        filtered.slice(options.skip || 0, options.take || 10),
      );
    }),
    count: jest.fn().mockImplementation((options) => {
      let filtered = mockUsers.filter((u) => u.isDeleted === 0);
      if (options.where.name?.contains) {
        filtered = filtered.filter((u) =>
          u.name.includes(options.where.name.contains),
        );
      }
      return Promise.resolve(filtered.length);
    }),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    // $transaction内で使用されるメソッド
    $disconnect: jest.fn(),
  },
};

describe('UsersDaoのテスト', () => {
  let dao: UsersDao;

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
    // 各モックをリセット
    jest.clearAllMocks();
  });

  describe('selectUsersのテスト', () => {
    const dto = new SelectUsersDto();
    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        mockPrismaService.users.findMany.mockResolvedValueOnce([mockUsers[0]]);
        const result = await dao.selectUsers({ id: 'uuid-1' });
        expect(result.length).toBe(1);
        expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: 0, id: 'uuid-1' },
          }),
        );
      });
      test('複数件の結果が返る場合', async () => {
        mockPrismaService.users.findMany.mockResolvedValueOnce(
          [mockUsers[0], mockUsers[1]].filter((u) => u.isDeleted === 0),
        );
        const result = await dao.selectUsers({});
        expect(result.length).toBe(1); // 削除フラグでフィルタリングされるため
        expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: 0 },
          }),
        );
      });
      test('0件の結果が返る場合', async () => {
        mockPrismaService.users.findMany.mockResolvedValueOnce([]);
        const result = await dao.selectUsers({ name: 'notfound' });
        expect(result.length).toBe(0);
        expect(mockPrismaService.users.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: 0, name: { contains: 'notfound' } },
          }),
        );
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaService.users.findMany.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(dao.selectUsers(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countUsersのテスト', () => {
    const dto = new SelectUsersDto();
    describe('正常系', () => {
      test('1が返る場合', async () => {
        mockPrismaService.users.count.mockResolvedValueOnce(1);
        const result = await dao.countUsers({ name: 'Active' });
        expect(result).toBe(1);
        expect(mockPrismaService.users.count).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: 0, name: { contains: 'Active' } },
          }),
        );
      });
      test('2以上が返る場合', async () => {
        mockPrismaService.users.count.mockResolvedValueOnce(5);
        const result = await dao.countUsers(dto);
        expect(result).toBe(5);
      });
      test('0が返る場合', async () => {
        mockPrismaService.users.count.mockResolvedValueOnce(0);
        const result = await dao.countUsers(dto);
        expect(result).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaService.users.count.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(dao.countUsers(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  const mockPrismaTx =
    mockPrismaService.users as unknown as PrismaTransaction['users'];
  const createDto: CreateUsersDto = {
    name: 'New User',
    email: 'new@example.com',
    password: 'newhash',
    registeredAt: new Date().toISOString(),
    registeredBy: 'user',
    isDeleted: 0,
  };

  describe('createUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        const createdUser = {
          ...mockUsers[0],
          id: 'uuid-new',
          email: createDto.email,
        };
        mockPrismaTx.create.mockResolvedValueOnce(createdUser);
        const result = await dao.createUsers(mockPrismaTx as any, createDto);
        expect(result.email).toBe(createDto.email);
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        mockPrismaTx.create.mockRejectedValueOnce({ code: 'P2002' });
        await expect(
          dao.createUsers(mockPrismaTx as any, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        mockPrismaTx.create.mockRejectedValueOnce({ code: 'P2003' });
        await expect(
          dao.createUsers(mockPrismaTx as any, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaTx.create.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(
          dao.createUsers(mockPrismaTx as any, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  const updateData: Users = { ...mockUsers[0], name: 'Updated Name' };

  describe('updateUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        mockPrismaTx.update.mockResolvedValueOnce(updateData);
        const result = await dao.updateUsers(mockPrismaTx as any, updateData);
        expect(result.name).toBe('Updated Name');
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        mockPrismaTx.update.mockRejectedValueOnce({ code: 'P2002' });
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        mockPrismaTx.update.mockRejectedValueOnce({ code: 'P2003' });
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(BadRequestException);
      });
      test('更新レコードが見つからない場合', async () => {
        mockPrismaTx.update.mockRejectedValueOnce({ code: 'P2025' });
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaTx.update.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(
          dao.updateUsers(mockPrismaTx as any, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('softDeleteUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に論理削除ができる場合', async () => {
        const softDeletedUser = { ...mockUsers[0], isDeleted: 1 };
        mockPrismaTx.update.mockResolvedValueOnce(softDeletedUser);
        const result = await dao.softDeleteUsers(mockPrismaTx as any, 'uuid-1');
        expect(result.isDeleted).toBe(1);
      });
    });
    describe('異常系', () => {
      test('論理削除レコードが見つからない場合', async () => {
        mockPrismaTx.update.mockRejectedValueOnce({ code: 'P2025' });
        await expect(
          dao.softDeleteUsers(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaTx.update.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(
          dao.softDeleteUsers(mockPrismaTx as any, 'uuid-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('hardDeleteUsersのテスト', () => {
    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        mockPrismaTx.delete.mockResolvedValueOnce(mockUsers[0]);
        const result = await dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-1');
        expect(result.id).toBe('uuid-1');
      });
    });
    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        mockPrismaTx.delete.mockRejectedValueOnce({ code: 'P2025' });
        await expect(
          dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('外部キー違反が発生した場合', async () => {
        mockPrismaTx.delete.mockRejectedValueOnce({ code: 'P2003' });
        await expect(
          dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-1'),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        mockPrismaTx.delete.mockRejectedValueOnce(
          new Error('DB connection failed'),
        );
        await expect(
          dao.hardDeleteUsers(mockPrismaTx as any, 'uuid-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
