/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesDao } from 'src/database/dao/services.dao';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateServicesDto } from 'src/database/dto/services.dto';
import { Services } from '@prisma/client';
import {
  InternalServerErrorException,
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
  services: {
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockServicesModel = mockPrismaService.services;
const mockPrismaTx = {
  services: mockServicesModel,
} as unknown as PrismaTransaction;

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
  describe('selectServicesByNameのテスト', () => {
    const NAME_TO_SEARCH = mockService.name;

    describe('正常系', () => {
      test('サービス名でレコードが取得できる場合', async () => {
        jest
          .spyOn(mockServicesModel, 'findFirst')
          .mockResolvedValueOnce(mockService);

        const result = await dao.selectServicesByName(NAME_TO_SEARCH);

        expect(result).toEqual(mockService);
        // PrismaのfindFirstが正しいwhere句で呼ばれたことを確認
        expect(mockServicesModel.findFirst).toHaveBeenCalledWith({
          where: {
            name: NAME_TO_SEARCH,
            isDeleted: false,
          },
        });
      });

      test('サービス名に一致するレコードが見つからない場合、nullが返る', async () => {
        jest.spyOn(mockServicesModel, 'findFirst').mockResolvedValueOnce(null);

        const result = await dao.selectServicesByName('Non-Existent Service');

        expect(result).toBeNull();
      });
    });

    describe('異常系', () => {
      test('DB接続エラーが発生した場合、InternalServerErrorExceptionがスローされる', async () => {
        jest
          .spyOn(mockServicesModel, 'findFirst')
          .mockRejectedValueOnce(new Error('DB connection failed'));

        await expect(dao.selectServicesByName(NAME_TO_SEARCH)).rejects.toThrow(
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
});
