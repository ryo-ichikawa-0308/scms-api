/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserServicesOrchestrator } from './user-services.orchestrator';
import { UserServicesCreateRequestDto } from './dto/user-services-create-request.dto';
import { UserServicesService } from 'src/service/user-services/user-services.service';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_USER_ID_IN_BODY = 'user-to-assign-001';
const MOCK_SERVICE_ID = 'service-id-001';
const MOCK_CREATED_ID = 'new-user-service-id-001';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');

const MOCK_REQUEST_BODY: UserServicesCreateRequestDto = {
  userId: MOCK_USER_ID_IN_BODY,
  serviceId: MOCK_SERVICE_ID,
  stock: 10,
};

// 依存関係のモック
const mockUserServicesService = {
  isValidUserService: jest.fn(),
  createWithTx: jest.fn(),
};

const mockPrismaTransaction = {
  $transaction: jest.fn(async (callback) => {
    return await callback('MOCK_PRISMA_TX' as unknown as PrismaTransaction);
  }),
};

describe('UserServicesOrchestrator (Orchestrator) Test', () => {
  let orchestrator: UserServicesOrchestrator;
  let userServicesService: typeof mockUserServicesService;
  let prismaTransaction: typeof mockPrismaTransaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserServicesOrchestrator,
        {
          provide: UserServicesService,
          useValue: mockUserServicesService,
        },
        {
          provide: PRISMA_TRANSACTION,
          useValue: mockPrismaTransaction,
        },
      ],
    }).compile();

    orchestrator = module.get<UserServicesOrchestrator>(
      UserServicesOrchestrator,
    );
    userServicesService = module.get(UserServicesService);
    prismaTransaction = module.get(PRISMA_TRANSACTION);

    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_TX_DATE as any);

    userServicesService.isValidUserService.mockResolvedValue(false);
    userServicesService.createWithTx.mockResolvedValue(MOCK_CREATED_ID);
  });

  afterAll(() => {
    jest.spyOn(global, 'Date').mockRestore();
  });

  it('オーケストレーションクラスが定義されていること', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('create', () => {
    describe('正常系', () => {
      it('サービスクラスのユーザー提供サービスが登録が実行されてIDが返ること', async () => {
        const result = await orchestrator.create(
          MOCK_REQUEST_BODY,
          MOCK_AUTH_USER_ID,
        );

        expect(userServicesService.isValidUserService).toHaveBeenCalledWith(
          MOCK_REQUEST_BODY.userId,
          MOCK_REQUEST_BODY.serviceId,
        );
        expect(userServicesService.isValidUserService).toHaveBeenCalledTimes(1);

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        const serviceCallArgs = userServicesService.createWithTx.mock.calls[0];
        const prismaTxArg = serviceCallArgs[0];
        const userIdArg = serviceCallArgs[1];
        const txDateTimeArg = serviceCallArgs[2];
        const dtoArg = serviceCallArgs[3];
        expect(prismaTxArg).toBe('MOCK_PRISMA_TX');
        expect(userIdArg).toBe(MOCK_AUTH_USER_ID);
        expect(txDateTimeArg).toEqual(MOCK_TX_DATE);
        expect(dtoArg).toEqual(MOCK_REQUEST_BODY);
        expect(userServicesService.createWithTx).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_CREATED_ID);
      });
    });

    describe('異常系', () => {
      it('ユーザー提供サービスが既に登録済みの場合', async () => {
        const errorMessage = 'このサービスは登録できません';
        userServicesService.isValidUserService.mockRejectedValue(
          new ConflictException(errorMessage),
        );

        await expect(
          orchestrator.create(MOCK_REQUEST_BODY, MOCK_AUTH_USER_ID),
        ).rejects.toThrow(ConflictException);
        await expect(
          orchestrator.create(MOCK_REQUEST_BODY, MOCK_AUTH_USER_ID),
        ).rejects.toThrow(errorMessage);

        expect(prismaTransaction.$transaction).not.toHaveBeenCalled();
        expect(userServicesService.createWithTx).not.toHaveBeenCalled();
      });
    });
  });
});
