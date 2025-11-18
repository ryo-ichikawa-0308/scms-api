/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/require-await */
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ServicesOrchestrator } from './services.orchestrator';
import { ServicesCreateRequestDto } from './dto/services-create-request.dto';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { ServicesService } from 'src/service/services/services.service';
import { fail } from 'assert';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_SERVICE_NAME = 'Test Service Name';
const MOCK_CREATED_ID = 'new-service-id-uuid';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');
const MOCK_PRISMA_TX: PrismaTransaction = {} as PrismaTransaction;

const MOCK_REQUEST_BODY: ServicesCreateRequestDto = {
  name: MOCK_SERVICE_NAME,
  price: 5000,
  description: '',
  unit: '',
};

// --- 依存オブジェクトのモック定義 ---
const mockServicesService = {
  isValidService: jest.fn(),
  createWithTx: jest.fn(),
};

const mockPrismaTransaction = {
  $transaction: jest.fn(async (callback) => {
    return callback(MOCK_PRISMA_TX);
  }),
};

describe('ServicesOrchestrator (Orchestrator) Test', () => {
  let orchestrator: ServicesOrchestrator;
  let servicesService: typeof mockServicesService;
  let prismaTransaction: typeof mockPrismaTransaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServicesOrchestrator,
        {
          provide: ServicesService,
          useValue: mockServicesService,
        },
        {
          provide: PRISMA_TRANSACTION,
          useValue: mockPrismaTransaction,
        },
      ],
    }).compile();

    orchestrator = module.get<ServicesOrchestrator>(ServicesOrchestrator);
    servicesService = module.get(ServicesService);
    prismaTransaction = module.get(PRISMA_TRANSACTION);

    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_TX_DATE as any);

    servicesService.isValidService.mockResolvedValue(false);
    servicesService.createWithTx.mockResolvedValue(MOCK_CREATED_ID);
  });

  afterAll(() => {
    jest.spyOn(global, 'Date').mockRestore();
  });

  it('オーケストレーションクラスが定義されていること', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('create', () => {
    describe('正常系', () => {
      it('サービスの登録に成功してIDが返ること', async () => {
        const result = await orchestrator.create(
          MOCK_REQUEST_BODY,
          MOCK_AUTH_USER_ID,
        );

        expect(servicesService.isValidService).toHaveBeenCalledWith(
          MOCK_REQUEST_BODY.name,
        );
        expect(servicesService.isValidService).toHaveBeenCalledTimes(1);

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        expect(servicesService.createWithTx).toHaveBeenCalledWith(
          MOCK_PRISMA_TX, // モックのトランザクションオブジェクト
          MOCK_AUTH_USER_ID, // 認証ユーザーID
          MOCK_TX_DATE, // モックされた現在時刻
          MOCK_REQUEST_BODY,
        );
        expect(servicesService.createWithTx).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_CREATED_ID);
      });
    });

    describe('異常系', () => {
      it('サービス名被りの場合', async () => {
        const errorMessage = 'このサービスは登録できません';
        servicesService.isValidService.mockRejectedValue(
          new ConflictException(errorMessage),
        );

        try {
          await orchestrator.create(MOCK_REQUEST_BODY, MOCK_AUTH_USER_ID);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(ConflictException);
          expect((error as ConflictException).message).toBe(errorMessage);
        }

        expect(prismaTransaction.$transaction).not.toHaveBeenCalled();
        expect(servicesService.createWithTx).not.toHaveBeenCalled();
      });
    });
  });
});
