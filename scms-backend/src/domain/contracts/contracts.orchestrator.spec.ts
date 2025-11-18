/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { ContractsCreateRequestDto } from './dto/contracts-create-request.dto';
import { ContractsService } from '../../service/contracts/contracts.service';
import { ContractsCancelPathParamsDto } from './dto/contracts-cancel-pathparams.dto';
import { ContractsOrchestrator } from './contracts.orchestrator';
import { fail } from 'assert';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_CONTRACT_ID = 'contract-id-123';
const MOCK_USER_SERVICES_ID = 'us-id-456';
const MOCK_CREATED_ID = MOCK_CONTRACT_ID;
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');
const MOCK_PRISMA_TX: PrismaTransaction = {} as PrismaTransaction;

const MOCK_CREATE_REQUEST: ContractsCreateRequestDto = {
  userServiceId: MOCK_USER_SERVICES_ID,
  quantity: 5,
};
const MOCK_CANCEL_PATH_PARAMS: ContractsCancelPathParamsDto = {
  id: MOCK_CONTRACT_ID,
};

// 依存関係のモック
const mockContractsService = {
  isValidContract: jest.fn(),
  createWithTx: jest.fn(),
  isValidCancel: jest.fn(),
  cancelWithTx: jest.fn(),
};

const mockPrismaTransaction = {
  $transaction: jest.fn(async (callback) => {
    return callback(MOCK_PRISMA_TX);
  }),
};

describe('ContractsOrchestrator (Orchestrator) Test', () => {
  let orchestrator: ContractsOrchestrator;
  let contractsService: typeof mockContractsService;
  let prismaTransaction: typeof mockPrismaTransaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsOrchestrator,
        {
          provide: ContractsService,
          useValue: mockContractsService,
        },
        {
          provide: PRISMA_TRANSACTION,
          useValue: mockPrismaTransaction,
        },
      ],
    }).compile();

    orchestrator = module.get<ContractsOrchestrator>(ContractsOrchestrator);
    contractsService = module.get(ContractsService);
    prismaTransaction = module.get(PRISMA_TRANSACTION);

    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_TX_DATE as any);

    mockContractsService.isValidContract.mockResolvedValue(undefined);
    mockContractsService.createWithTx.mockResolvedValue(MOCK_CREATED_ID);
    mockContractsService.isValidCancel.mockResolvedValue(undefined);
    mockContractsService.cancelWithTx.mockResolvedValue(undefined);
  });

  afterAll(() => {
    jest.spyOn(global, 'Date').mockRestore();
  });

  it('オーケストレーションクラスが定義されていること', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('create', () => {
    describe('正常系', () => {
      it('契約が作成されてIDが返ること', async () => {
        const result = await orchestrator.create(
          MOCK_CREATE_REQUEST,
          MOCK_AUTH_USER_ID,
        );

        expect(contractsService.isValidContract).toHaveBeenCalledWith(
          MOCK_CREATE_REQUEST,
        );
        expect(contractsService.isValidContract).toHaveBeenCalledTimes(1);

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        expect(contractsService.createWithTx).toHaveBeenCalledWith(
          MOCK_PRISMA_TX, // モックのトランザクションオブジェクト
          MOCK_AUTH_USER_ID, // 認証ユーザーID
          MOCK_TX_DATE, // モックされた現在時刻
          MOCK_CREATE_REQUEST,
        );
        expect(contractsService.createWithTx).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_CREATED_ID);
      });
    });

    describe('異常系', () => {
      it('ユーザー提供サービスが存在しない場合', async () => {
        const errorMessage = '参照ユーザーサービスが存在しません';
        contractsService.isValidContract.mockRejectedValue(
          new NotFoundException(errorMessage),
        );

        try {
          await orchestrator.create(MOCK_CREATE_REQUEST, MOCK_AUTH_USER_ID);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect((error as NotFoundException).message).toBe(errorMessage);
        }

        expect(prismaTransaction.$transaction).not.toHaveBeenCalled();
        expect(contractsService.createWithTx).not.toHaveBeenCalled();
      });

      it('契約登録に失敗した場合', async () => {
        const errorMessage = '登録処理中にシステムエラーが発生しました';
        contractsService.createWithTx.mockRejectedValue(
          new InternalServerErrorException(errorMessage),
        );

        try {
          await orchestrator.create(MOCK_CREATE_REQUEST, MOCK_AUTH_USER_ID);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect((error as InternalServerErrorException).message).toBe(
            errorMessage,
          );
        }
      });
    });
  });

  describe('cancel', () => {
    describe('正常系', () => {
      it('解約が成功すること', async () => {
        await orchestrator.cancel(MOCK_CANCEL_PATH_PARAMS, MOCK_AUTH_USER_ID);

        expect(contractsService.isValidCancel).toHaveBeenCalledWith(
          MOCK_CONTRACT_ID,
        );
        expect(contractsService.isValidCancel).toHaveBeenCalledTimes(1);

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        expect(contractsService.cancelWithTx).toHaveBeenCalledWith(
          MOCK_PRISMA_TX, // モックのトランザクションオブジェクト
          MOCK_AUTH_USER_ID, // 認証ユーザーID
          MOCK_TX_DATE, // モックされた現在時刻
          MOCK_CONTRACT_ID,
        );
        expect(contractsService.cancelWithTx).toHaveBeenCalledTimes(1);
      });
    });

    describe('異常系', () => {
      it('解約対象の契約が存在しない場合', async () => {
        const errorMessage = '契約情報が存在しません';
        contractsService.isValidCancel.mockRejectedValue(
          new NotFoundException(errorMessage),
        );

        try {
          await orchestrator.cancel(MOCK_CANCEL_PATH_PARAMS, MOCK_AUTH_USER_ID);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(NotFoundException);
          expect((error as NotFoundException).message).toBe(errorMessage);
        }

        expect(prismaTransaction.$transaction).not.toHaveBeenCalled();
        expect(contractsService.cancelWithTx).not.toHaveBeenCalled();
      });

      it('解約処理に失敗した場合', async () => {
        const errorMessage = '解約処理中にシステムエラーが発生しました';
        contractsService.cancelWithTx.mockRejectedValue(
          new InternalServerErrorException(errorMessage),
        );

        try {
          await orchestrator.cancel(MOCK_CANCEL_PATH_PARAMS, MOCK_AUTH_USER_ID);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect((error as InternalServerErrorException).message).toBe(
            errorMessage,
          );
        }
      });
    });
  });
});
