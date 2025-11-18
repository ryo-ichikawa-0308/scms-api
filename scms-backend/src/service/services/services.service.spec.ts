import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesDao } from 'src/database/dao/services.dao';
import { ServicesCreateRequestDto } from 'src/domain/services/dto/services-create-request.dto';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { CreateServicesDto } from 'src/database/dto/services.dto';
import { Services } from '@prisma/client';

// --- モックデータ ---
const MOCK_USER_ID = 'executor-user-id';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');
const CREATED_SERVICE_ID = 'service-0001';

const mockRequestDto: ServicesCreateRequestDto = {
  name: 'New Service',
  description: 'A new service description',
  price: 5000,
  unit: '時間',
};

// ServicesDaoのcreateServicesの戻り値（ServicesテーブルのPrisma型を模擬）
const mockCreatedServiceRecord: Partial<Services> = {
  id: CREATED_SERVICE_ID,
  name: mockRequestDto.name,
  description: mockRequestDto.description,
  price: mockRequestDto.price,
  unit: mockRequestDto.unit,
};

// 依存関係のモック
const mockPrismaTx: PrismaTransaction = {} as PrismaTransaction;

const mockServicesDao = {
  createServices: jest.fn(),
  selectServicesByName: jest.fn(),
};

describe('ServicesService (Service) Test', () => {
  let service: ServicesService;
  let dao: typeof mockServicesDao;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesService,
        {
          provide: ServicesDao,
          useValue: mockServicesDao,
        },
      ],
    }).compile();

    service = module.get<ServicesService>(ServicesService);
    dao = module.get(ServicesDao);

    jest.clearAllMocks();

    dao.createServices.mockResolvedValue(mockCreatedServiceRecord);
  });

  it('サービスクラスが定義されていること', () => {
    expect(service).toBeDefined();
  });
  describe('createWithTx', () => {
    describe('正常系', () => {
      it('サービスのレコードが作成できること', async () => {
        const result = await service.createWithTx(
          mockPrismaTx,
          MOCK_USER_ID,
          MOCK_TX_DATE,
          mockRequestDto,
        );

        const expectedCreateDto: CreateServicesDto = {
          name: mockRequestDto.name,
          description: mockRequestDto.description,
          price: mockRequestDto.price,
          unit: mockRequestDto.unit,
          registeredBy: MOCK_USER_ID,
          registeredAt: MOCK_TX_DATE,
          isDeleted: false,
        };
        expect(dao.createServices).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining(expectedCreateDto),
        );

        expect(result).toBe(CREATED_SERVICE_ID);
      });
    });

    describe('異常系', () => {
      it('サービスのレコード作成が失敗すること', async () => {
        dao.createServices.mockResolvedValue(null);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow(InternalServerErrorException);
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow('サービス登録に失敗しました');
      });

      it('サービスの登録に失敗すること', async () => {
        const mockError = new Error('Database integrity error');
        dao.createServices.mockRejectedValue(mockError);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow(mockError);
      });
    });
  });

  describe('isValidService', () => {
    const testServiceName = 'Existing Service';

    describe('正常系', () => {
      it('サービスが存在する場合、例外送出すること', async () => {
        dao.selectServicesByName.mockResolvedValue(mockCreatedServiceRecord);
        try {
          await service.isValidService(testServiceName);
          fail('例外検出できなかったのでテスト失敗');
        } catch (e) {
          expect(dao.selectServicesByName).toHaveBeenCalledWith(
            testServiceName,
          );
          expect(e).toBeInstanceOf(ConflictException);
          expect((e as ConflictException).message).toBe(
            'このサービスは登録できません',
          );
        }
      });

      it('サービスが存在しない場合、例外送出しないこと', async () => {
        dao.selectServicesByName.mockResolvedValue(null);
        await expect(
          service.isValidService(testServiceName),
        ).resolves.not.toThrow(ConflictException);
        expect(dao.selectServicesByName).toHaveBeenCalledWith(testServiceName);
      });
    });

    describe('異常系', () => {
      it('サービスの存在チェックに失敗すること', async () => {
        const mockError = new Error('DAO connection error');
        dao.selectServicesByName.mockRejectedValue(mockError);

        await expect(service.isValidService(testServiceName)).rejects.toThrow(
          mockError,
        );
      });
    });
  });
});
