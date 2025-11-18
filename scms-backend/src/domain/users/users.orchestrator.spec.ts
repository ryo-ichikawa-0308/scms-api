/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { randomUUID } from 'crypto';
jest.mock('crypto', () => ({
  randomUUID: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersOrchestrator } from './users.orchestrator';
import { UsersService } from '../../service/users/users.service';
import { UsersCreateRequestDto } from './dto/users-create-request.dto';
import { PRISMA_TRANSACTION, PrismaTransaction } from 'src/prisma/prisma.type';

const MOCK_NEW_USER_ID = '00000000-0000-0000-0000-000000000001';
const MOCK_CREATED_ID = '00000000-0000-0000-0000-000000000002';
const mockRequestDto: UsersCreateRequestDto = {
  name: 'New User',
  email: 'newuser@test.com',
  password: 'testpassword',
};

// UsersServiceのモック
const mockUsersService = {
  isValidEmail: jest.fn(),
  createWithTx: jest.fn(),
};

const mockPrismaTransaction = {
  $transaction: jest.fn(async (callback) => {
    return await callback('MOCK_PRISMA_TX' as unknown as PrismaTransaction);
  }),
};

describe('UsersOrchestrator (Orchestrator) Test', () => {
  let orchestrator: UsersOrchestrator;
  let prismaTx: typeof mockPrismaTransaction;
  let service: typeof mockUsersService;
  let randomUUIDMock: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersOrchestrator,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PRISMA_TRANSACTION,
          useValue: mockPrismaTransaction,
        },
      ],
    }).compile();

    orchestrator = module.get<UsersOrchestrator>(UsersOrchestrator);
    prismaTx = module.get(PRISMA_TRANSACTION);
    service = module.get(UsersService);
    randomUUIDMock = randomUUID as jest.Mock;

    jest.clearAllMocks();

    // デフォルトのモック設定
    service.isValidEmail.mockResolvedValue(false);
    service.createWithTx.mockResolvedValue(MOCK_CREATED_ID);
    randomUUIDMock.mockReturnValue(MOCK_NEW_USER_ID);
  });

  it('オーケストレーションクラスが定義されていること', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('create - 正常系', () => {
    it('サービスクラスのユーザー作成が実行されてユーザーIDが返ること', async () => {
      const result = await orchestrator.create(mockRequestDto);
      expect(service.isValidEmail).toHaveBeenCalledWith(mockRequestDto.email);
      expect(prismaTx.$transaction).toHaveBeenCalled();
      expect(randomUUIDMock).toHaveBeenCalled();

      const serviceCallArgs = service.createWithTx.mock.calls[0];
      const prismaTxArg = serviceCallArgs[0];
      const userIdArg = serviceCallArgs[1];
      const txDateTimeArg = serviceCallArgs[2];
      const dtoArg = serviceCallArgs[3];

      expect(prismaTxArg).toBe('MOCK_PRISMA_TX');
      expect(userIdArg).toBe(MOCK_NEW_USER_ID);
      expect(txDateTimeArg).toBeInstanceOf(Date);
      expect(dtoArg).toEqual(mockRequestDto);

      expect(result).toBe(MOCK_CREATED_ID);
    });
  });

  describe('create - 異常系', () => {
    it('ユーザーのメールアドレスが登録済の場合', async () => {
      const errorMessage = 'このユーザーは登録できません';
      service.isValidEmail.mockRejectedValue(
        new ConflictException(errorMessage),
      );
      await expect(orchestrator.create(mockRequestDto)).rejects.toThrow(
        ConflictException,
      );

      await expect(orchestrator.create(mockRequestDto)).rejects.toThrow(
        errorMessage,
      );

      expect(service.isValidEmail).toHaveBeenCalledWith(mockRequestDto.email);

      expect(prismaTx.$transaction).not.toHaveBeenCalled();
      expect(service.createWithTx).not.toHaveBeenCalled();
    });

    it('トランザクションが失敗して登録失敗すること', async () => {
      const mockServiceError = new InternalServerErrorException('DB登録エラー');
      service.createWithTx.mockRejectedValue(mockServiceError);

      await expect(orchestrator.create(mockRequestDto)).rejects.toThrow(
        mockServiceError,
      );

      expect(prismaTx.$transaction).toHaveBeenCalled();
      expect(service.createWithTx).toHaveBeenCalled();
    });

    it('UUID発番が失敗すること(レアケース)', async () => {
      const mockUUIDError = new Error('UUID generation failed');
      randomUUIDMock.mockImplementation(() => {
        throw mockUUIDError;
      });

      await expect(orchestrator.create(mockRequestDto)).rejects.toThrow(
        mockUUIDError,
      );

      expect(prismaTx.$transaction).not.toHaveBeenCalled();
    });
  });
});
