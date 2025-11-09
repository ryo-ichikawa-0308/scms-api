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
import { Services, Prisma } from '@prisma/client';
import {
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

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

const mockServicesModel = mockPrismaService.services;
const mockPrismaTx = {
  services: mockServicesModel,
} as unknown as Prisma.TransactionClient;

const { PrismaClientKnownRequestError } = jest.requireActual(
  '@prisma/client/runtime/library',
);
const mockPrismaError = (code: string) => {
  return new PrismaClientKnownRequestError(`Mock error for code ${code}`, {
    code: code,
    clientVersion: 'test-version',
    meta: {
      target: code === 'P2002' ? ['name'] : undefined, // Servicesモデルのunique制約はnameとisDeleted
    },
  } as any);
};

describe('ServicesDaoのテスト', () => {
  let dao: ServicesDao;

  const MOCK_UUID = '12345678-1234-5678-1234-567812345678';
  const mockService: Services = {
    id: MOCK_UUID,
    name: 'Test Service',
    description: 'Service Description',
    price: 1000,
    unit: '回',
    registeredAt: new Date(),
    registeredBy: MOCK_UUID,
    updatedAt: new Date(),
    updatedBy: MOCK_UUID,
    isDeleted: false,
  };

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
    const selectDto = new SelectServicesDto();
    selectDto.name = 'Test';

    describe('正常系', () => {
      test('1件の結果が返る場合', async () => {
        const result: Services[] = [{ ...mockService, name: 'Test Service 1' }];
        jest.spyOn(mockServicesModel, 'findMany').mockResolvedValueOnce(result);

        const services = await dao.selectServices(selectDto);

        expect(services).toEqual(result);
        expect(mockServicesModel.findMany).toHaveBeenCalledWith({
          where: { isDeleted: false, name: { contains: 'Test' } },
          skip: undefined,
          take: undefined,
          orderBy: {},
        });
      });
      test('複数件の結果が返る場合', async () => {
        const result: Services[] = [
          { ...mockService, name: 'Service A' },
          { ...mockService, id: '2', name: 'Service B' },
        ];
        jest.spyOn(mockServicesModel, 'findMany').mockResolvedValueOnce(result);
        selectDto.limit = 10;
        selectDto.sortBy = 'name';
        selectDto.sortOrder = 'asc';

        const services = await dao.selectServices(selectDto);

        expect(services).toEqual(result);
        expect(mockServicesModel.findMany).toHaveBeenCalledWith({
          where: { isDeleted: false, name: { contains: 'Test' } },
          skip: undefined,
          take: 10,
          orderBy: { name: 'asc' },
        });
        selectDto.limit = undefined;
        selectDto.sortBy = undefined;
        selectDto.sortOrder = undefined;
      });
      test('0件の結果が返る場合', async () => {
        const result: Services[] = [];
        jest.spyOn(mockServicesModel, 'findMany').mockResolvedValueOnce(result);

        const services = await dao.selectServices(new SelectServicesDto());

        expect(services).toEqual([]);
        expect(mockServicesModel.findMany).toHaveBeenCalledWith({
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
          .spyOn(mockServicesModel, 'findMany')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.selectServices(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('countServicesのテスト', () => {
    const selectDto = new SelectServicesDto();
    selectDto.price = 1000;

    describe('正常系', () => {
      test('1が返る場合', async () => {
        jest.spyOn(mockServicesModel, 'count').mockResolvedValueOnce(1);

        const count = await dao.countServices(selectDto);

        expect(count).toBe(1);
        expect(mockServicesModel.count).toHaveBeenCalledWith({
          where: { isDeleted: false, price: 1000 },
        });
      });
      test('2以上が返る場合', async () => {
        jest.spyOn(mockServicesModel, 'count').mockResolvedValueOnce(5);

        const count = await dao.countServices(selectDto);

        expect(count).toBe(5);
      });
      test('0が返る場合', async () => {
        jest.spyOn(mockServicesModel, 'count').mockResolvedValueOnce(0);

        const count = await dao.countServices(selectDto);

        expect(count).toBe(0);
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'count')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(dao.countServices(selectDto)).rejects.toThrow(
          InternalServerErrorException,
        );
      });
    });
  });

  describe('createServicesのテスト', () => {
    const createDto: CreateServicesDto = {
      name: 'New Service',
      description: 'New Description',
      price: 2000,
      unit: '月',
      registeredBy: MOCK_UUID,
    };
    const createdService: Services = {
      ...mockService,
      ...createDto,
      id: 'new-id',
      updatedAt: null,
      updatedBy: null,
    };

    describe('正常系', () => {
      test('正常に登録ができる場合', async () => {
        jest
          .spyOn(mockServicesModel, 'create')
          .mockResolvedValueOnce(createdService);

        const service = await dao.createServices(mockPrismaTx, createDto);

        expect(service).toEqual(createdService);
        expect(mockServicesModel.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            name: createDto.name,
            price: createDto.price,
          }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(
          dao.createServices(mockPrismaTx, createDto),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'create')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.createServices(mockPrismaTx, createDto),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'create')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.createServices(mockPrismaTx, createDto),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('updateServicesのテスト', () => {
    const updateData: Services = {
      ...mockService,
      price: 3000,
      updatedAt: new Date(),
      updatedBy: 'updater-id',
    };

    describe('正常系', () => {
      test('正常に更新ができる場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockResolvedValueOnce(updateData);

        const service = await dao.updateServices(mockPrismaTx, updateData);

        expect(service).toEqual(updateData);
        expect(mockServicesModel.update).toHaveBeenCalledWith({
          where: { id: updateData.id },
          data: expect.objectContaining({ price: updateData.price }),
        });
      });
    });

    describe('異常系', () => {
      test('一意制約違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2002'));

        await expect(
          dao.updateServices(mockPrismaTx, updateData),
        ).rejects.toThrow(ConflictException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.updateServices(mockPrismaTx, updateData),
        ).rejects.toThrow(BadRequestException);
      });
      test('更新レコードが見つからない場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.updateServices(mockPrismaTx, updateData),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.updateServices(mockPrismaTx, updateData),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('softDeleteServicesのテスト', () => {
    const deleteId = MOCK_UUID;
    const updatedAt = new Date();
    const updatedBy = 'deleter-id';
    const softDeletedService: Services = {
      ...mockService,
      id: deleteId,
      isDeleted: true,
      updatedAt,
      updatedBy,
    };

    describe('正常系', () => {
      test('対象レコードが論理削除されていない場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockResolvedValueOnce(softDeletedService);

        const service = await dao.softDeleteServices(
          mockPrismaTx,
          deleteId,
          updatedAt,
          updatedBy,
        );

        expect(service).toEqual(softDeletedService);
        expect(mockServicesModel.update).toHaveBeenCalledWith({
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
          .spyOn(mockServicesModel, 'update')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.softDeleteServices(mockPrismaTx, deleteId, updatedAt, updatedBy),
        ).rejects.toThrow(NotFoundException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'update')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.softDeleteServices(mockPrismaTx, deleteId, updatedAt, updatedBy),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });

  describe('hardDeleteServicesのテスト', () => {
    const deleteId = MOCK_UUID;

    describe('正常系', () => {
      test('正常に物理削除ができる場合', async () => {
        jest
          .spyOn(mockServicesModel, 'delete')
          .mockResolvedValueOnce(mockService);

        const service = await dao.hardDeleteServices(mockPrismaTx, deleteId);

        expect(service).toEqual(mockService);
        expect(mockServicesModel.delete).toHaveBeenCalledWith({
          where: { id: deleteId },
        });
      });
    });

    describe('異常系', () => {
      test('物理削除レコードが見つからない場合', async () => {
        jest
          .spyOn(mockServicesModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2025'));

        await expect(
          dao.hardDeleteServices(mockPrismaTx, deleteId),
        ).rejects.toThrow(NotFoundException);
      });
      test('外部キー違反が発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'delete')
          .mockRejectedValueOnce(mockPrismaError('P2003'));

        await expect(
          dao.hardDeleteServices(mockPrismaTx, deleteId),
        ).rejects.toThrow(BadRequestException);
      });
      test('DB接続エラーが発生した場合', async () => {
        jest
          .spyOn(mockServicesModel, 'delete')
          .mockRejectedValueOnce(new Error('DB Error'));

        await expect(
          dao.hardDeleteServices(mockPrismaTx, deleteId),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
