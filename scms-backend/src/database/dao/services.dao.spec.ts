/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesDao } from 'src/database/dao/services.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  SelectServicesDto,
  CreateServicesDto,
} from 'src/database/dto/services.dto';
import { PrismaTransaction } from 'src/prisma/prisma.service';
import {
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Services } from '@prisma/client';

// サービス情報のモック
const mockServices: Services[] = [
  {
    id: 'uuid-svc-1',
    name: 'Service A',
    description: 'Desc A',
    price: 100,
    unit: 'ea',
    registeredAt: new Date(),
    registeredBy: 'system',
    updatedAt: null,
    updatedBy: null,
    isDeleted: false,
  },
  {
    id: 'uuid-svc-2',
    name: 'Deleted Service B',
    description: 'Desc B',
    price: 200,
    unit: 'ea',
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
  services: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockServicesTxModel = mockPrismaService.services;
const mockPrismaTx = {
  services: mockServicesTxModel,
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

describe('ServicesDaoのテスト', () => {
  let dao: ServicesDao;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesDao,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    dao = module.get<ServicesDao>(ServicesDao);
    jest.clearAllMocks();
  });

  describe('selectServicesのテスト', () => {
    const dto = new SelectServicesDto();
    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'findMany')
          .mockResolvedValueOnce([mockServices[0]]);
        const result = await dao.selectServices({ id: 'uuid-svc-1' });
        expect(result.length).toBe(1);
        expect(mockPrismaService.services.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { isDeleted: false, id: 'uuid-svc-1' },
          }),
        );
      });
      test('複数件の結果が返る場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'findMany')
          .mockResolvedValueOnce(
            mockServices.filter((s) => s.isDeleted === false),
          );
        const result = await dao.selectServices(dto);
        expect(result.length).toBe(1); // 削除フラグでフィルタリングされるため
      });
      test('0件の結果が返る場合', async () => {
        jest.spyOn(mockServicesTxModel, 'findMany').mockResolvedValueOnce([]);
        const result = await dao.selectServices({ name: 'notfound' });
        expect(result.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'findMany')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(dao.selectServices(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countServicesのテスト', () => {
    const dto = new SelectServicesDto();
    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(mockServicesTxModel, 'count').mockResolvedValueOnce(1);
        const result = await dao.countServices(dto);
        expect(result).toBe(1);
      });
      test('0が返る場合', async () => {
        jest.spyOn(mockServicesTxModel, 'count').mockResolvedValueOnce(0);
        const result = await dao.countServices(dto);
        expect(result).toBe(0);
      });
    });
    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'count')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(dao.countServices(dto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  const createDto: CreateServicesDto = {
    name: 'New Service',
    description: 'New Desc',
    price: 300,
    unit: 'day',
    registeredAt: new Date().toISOString(),
    registeredBy: 'user',
    isDeleted: false,
  };

  describe('createServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        const createdService = {
          ...mockServices[0],
          id: 'uuid-new',
          name: createDto.name,
        };
        jest
          .spyOn(mockServicesTxModel, 'create')
          .mockResolvedValueOnce(createdService);
        const result = await dao.createServices(mockPrismaTx as any, createDto);
        expect(result.name).toBe(createDto.name);
      });
    });
    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));
        await expect(
          dao.createServices(mockPrismaTx as any, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.createServices(mockPrismaTx as any, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'create')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.createServices(mockPrismaTx as any, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  const updateData: Services = { ...mockServices[0], name: 'Updated Service' };

  describe('updateServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'update')
          .mockResolvedValueOnce(updateData);
        const result = await dao.updateServices(
          mockPrismaTx as any,
          updateData,
        );
        expect(result.name).toBe('Updated Service');
      });
    });
    describe('異常系', () => {
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.updateServices(mockPrismaTx as any, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'update')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.updateServices(mockPrismaTx as any, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('softDeleteServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に論理削除ができる場合', async () => {
        const softDeletedService = { ...mockServices[0], isDeleted: true };
        jest
          .spyOn(mockServicesTxModel, 'update')
          .mockResolvedValueOnce(softDeletedService);
        const result = await dao.softDeleteServices(
          mockPrismaTx as any,
          'uuid-svc-1',
        );
        expect(result.isDeleted).toBe(true);
      });
    });
    describe('異常系', () => {
      test('論理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.softDeleteServices(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'update')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.softDeleteServices(mockPrismaTx as any, 'uuid-svc-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('hardDeleteServicesのテスト', () => {
    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'delete')
          .mockResolvedValueOnce(mockServices[0]);
        const result = await dao.hardDeleteServices(
          mockPrismaTx as any,
          'uuid-svc-1',
        );
        expect(result.id).toBe('uuid-svc-1');
      });
    });
    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2025'));
        await expect(
          dao.hardDeleteServices(mockPrismaTx as any, 'uuid-not-found'),
        ).rejects.toThrow(NotFoundException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2003'));
        await expect(
          dao.hardDeleteServices(mockPrismaTx as any, 'uuid-svc-1'),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesTxModel, 'delete')
          .mockRejectedValueOnce(new Error('DB connection failed'));
        await expect(
          dao.hardDeleteServices(mockPrismaTx as any, 'uuid-svc-1'),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
