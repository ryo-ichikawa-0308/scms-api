/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PRISMA_TRANSACTION,
  type PrismaTransaction,
} from 'src/prisma/prisma.type';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { AuthService } from '../../service/auth/auth.service';
import { AuthOrchestrator } from './auth.orchestrator';
import { fail } from 'assert';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_AUTH_USER_NAME = 'TestUser';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');
const MOCK_PRISMA_TX: PrismaTransaction = {} as PrismaTransaction;

const MOCK_LOGIN_REQUEST: AuthLoginRequestDto = {
  email: 'test@example.com',
  password: 'password123',
};
const MOCK_LOGIN_RESPONSE: AuthLoginResponseDto = {
  token: { accessToken: 'new-access-token', expiresIn: 3600 },
  refreshToken: 'new-refresh-token',
  refreshTokenExpiresIn: 604800,
  id: MOCK_AUTH_USER_ID,
  name: 'user-name',
};
const MOCK_REFRESH_RESPONSE: AuthRefreshResponseDto = {
  token: { accessToken: 'refreshed-access-token', expiresIn: 3600 },
  refreshToken: 'refreshed-refresh-token',
  refreshTokenExpiresIn: 604800,
};

// 依存関係のモック
const mockAuthService = {
  getUserId: jest.fn(),
  loginWithTx: jest.fn(),
  logoutWithTx: jest.fn(),
  refreshWithTx: jest.fn(),
};

const mockPrismaTransaction = {
  $transaction: jest.fn(async (callback) => {
    return callback(MOCK_PRISMA_TX);
  }),
};

describe('AuthOrchestrator (Orchestrator) Test', () => {
  let orchestrator: AuthOrchestrator;
  let authService: typeof mockAuthService;
  let prismaTransaction: typeof mockPrismaTransaction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthOrchestrator,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: PRISMA_TRANSACTION,
          useValue: mockPrismaTransaction,
        },
      ],
    }).compile();

    orchestrator = module.get<AuthOrchestrator>(AuthOrchestrator);
    authService = module.get(AuthService);
    prismaTransaction = module.get(PRISMA_TRANSACTION);

    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => MOCK_TX_DATE as any);

    mockAuthService.getUserId.mockResolvedValue(MOCK_AUTH_USER_ID);
    mockAuthService.loginWithTx.mockResolvedValue(MOCK_LOGIN_RESPONSE);
    mockAuthService.logoutWithTx.mockResolvedValue(undefined);
    mockAuthService.refreshWithTx.mockResolvedValue(MOCK_REFRESH_RESPONSE);
  });

  afterAll(() => {
    jest.spyOn(global, 'Date').mockRestore();
  });

  it('オーケストレーションクラスが定義されていること', () => {
    expect(orchestrator).toBeDefined();
  });

  describe('login', () => {
    describe('正常系', () => {
      it('ログイン成功して認証情報が返ること', async () => {
        const result = await orchestrator.login(MOCK_LOGIN_REQUEST);

        expect(authService.getUserId).toHaveBeenCalledWith(
          MOCK_LOGIN_REQUEST.email,
          MOCK_LOGIN_REQUEST.password,
        );

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        expect(authService.loginWithTx).toHaveBeenCalledWith(
          MOCK_PRISMA_TX, // モックのトランザクションオブジェクト
          MOCK_TX_DATE, // モックされた現在時刻
          MOCK_AUTH_USER_ID, // 認証済みユーザーID
        );
        expect(authService.loginWithTx).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_LOGIN_RESPONSE);
      });
    });

    describe('異常系', () => {
      it('認証に失敗した場合', async () => {
        const errorMessage = '認証情報が不正です';
        authService.getUserId.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );

        try {
          await orchestrator.login(MOCK_LOGIN_REQUEST);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
          expect((error as UnauthorizedException).message).toBe(errorMessage);
        }

        expect(prismaTransaction.$transaction).not.toHaveBeenCalled();
        expect(authService.loginWithTx).not.toHaveBeenCalled();
      });

      it('認証プロセスが失敗', async () => {
        const errorMessage = 'トークン生成中にシステムエラーが発生しました';
        authService.loginWithTx.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );

        try {
          await orchestrator.login(MOCK_LOGIN_REQUEST);
          fail('Expected an exception, but none was thrown.');
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
          expect((error as UnauthorizedException).message).toBe(errorMessage);
        }
      });
    });
  });

  describe('logout', () => {
    describe('正常系', () => {
      it('ログアウトに成功すること', async () => {
        await orchestrator.logout(MOCK_AUTH_USER_ID);

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        expect(authService.logoutWithTx).toHaveBeenCalledWith(
          MOCK_PRISMA_TX, // モックのトランザクションオブジェクト
          MOCK_AUTH_USER_ID, // 認証ユーザーID
          MOCK_TX_DATE, // モックされた現在時刻
        );
        expect(authService.logoutWithTx).toHaveBeenCalledTimes(1);
      });
    });

    describe('異常系', () => {
      it('ログアウトに失敗した場合', async () => {
        const errorMessage = 'ログアウト処理中にDBエラーが発生しました';
        authService.logoutWithTx.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );

        try {
          await orchestrator.logout(MOCK_AUTH_USER_ID);
          fail('Expected an exception, but none was thrown.');
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
          expect((error as UnauthorizedException).message).toBe(errorMessage);
        }
      });
    });
  });

  describe('refresh', () => {
    describe('正常系', () => {
      it('トークン更新に成功して新しいトークンが返ること', async () => {
        const result = await orchestrator.refresh(
          MOCK_AUTH_USER_ID,
          MOCK_AUTH_USER_NAME,
        );

        expect(prismaTransaction.$transaction).toHaveBeenCalledTimes(1);

        expect(authService.refreshWithTx).toHaveBeenCalledWith(
          MOCK_PRISMA_TX, // モックのトランザクションオブジェクト
          MOCK_TX_DATE, // モックされた現在時刻
          MOCK_AUTH_USER_ID, // 認証ユーザーID
          MOCK_AUTH_USER_NAME, // ユーザー名
        );
        expect(authService.refreshWithTx).toHaveBeenCalledTimes(1);

        expect(result).toBe(MOCK_REFRESH_RESPONSE);
      });
    });

    describe('異常系', () => {
      it('トークン更新に失敗した場合', async () => {
        const errorMessage = 'リフレッシュ処理中にトークンが無効になりました';
        authService.refreshWithTx.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );

        try {
          await orchestrator.refresh(MOCK_AUTH_USER_ID, MOCK_AUTH_USER_NAME);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(error).toBeInstanceOf(UnauthorizedException);
          expect((error as UnauthorizedException).message).toBe(errorMessage);
        }
      });
    });
  });
});
