/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthOrchestrator } from './auth.orchestrator';
import { AuthGuard } from '@nestjs/passport';
import { CanActivate, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { ConfigService } from '@nestjs/config';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_AUTH_USER_NAME = 'TestUser';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token-jwt';
const MOCK_REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 3600 * 1000; // 1週間(ミリ秒)
const MOCK_DATE_TIME = new Date('2025-10-26T10:00:00.000Z');
const MOCK_LOGIN_REQUEST: AuthLoginRequestDto = {
  email: 'test@example.com',
  password: 'password123',
};
const MOCK_LOGIN_RESPONSE: AuthLoginResponseDto = {
  token: { accessToken: 'mock-access-token', expiresIn: 3600 },
  refreshToken: MOCK_REFRESH_TOKEN,
  refreshTokenExpiresIn: MOCK_REFRESH_TOKEN_EXPIRES_IN,
  id: MOCK_AUTH_USER_ID,
  name: 'user-name',
};
const MOCK_REFRESH_RESPONSE: AuthRefreshResponseDto = {
  token: { accessToken: 'mock-access-token-refreshed', expiresIn: 3600 },
  refreshToken: 'mock-refresh-token-refreshed',
  refreshTokenExpiresIn: MOCK_REFRESH_TOKEN_EXPIRES_IN,
};

// 依存関係のモック
const mockAuthOrchestrator = {
  login: jest.fn(),
  logout: jest.fn(),
  refresh: jest.fn(),
};

const mockAuthGuard: CanActivate = {
  canActivate: jest.fn(() => true),
};
const mockRefreshGuard: CanActivate = {
  canActivate: jest.fn(() => true),
};

const mockRequest = (
  userId: string,
  username: string = '',
): Partial<Request> => ({
  user: { userId, username },
});

const mockResponse = () =>
  ({
    cookie: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
    send: jest.fn(),
  }) as unknown as Response;

const mockConfigService = {
  getOrThrow: jest.fn(),
};

describe('AuthController (Controller) Test', () => {
  let controller: AuthController;
  let authOrchestrator: typeof mockAuthOrchestrator;
  let configService: ConfigService;
  let res: Response;
  beforeAll(() => {
    jest.useFakeTimers();
  });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthOrchestrator, useValue: mockAuthOrchestrator },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .overrideGuard(AuthGuard('jwt-refresh'))
      .useValue(mockRefreshGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authOrchestrator = module.get(AuthOrchestrator);
    configService = module.get<ConfigService>(ConfigService);
    jest.spyOn(configService, 'getOrThrow').mockReturnValue('refresh_token');
    res = mockResponse();

    jest.clearAllMocks();
    jest.setSystemTime(MOCK_DATE_TIME);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('コントローラークラスが定義されていること', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    describe('正常系', () => {
      it('ログインに成功してアクセストークンが返り、リフレッシュトークンがCookieに設定されること', async () => {
        authOrchestrator.login.mockResolvedValue(MOCK_LOGIN_RESPONSE);

        const result = await controller.login(MOCK_LOGIN_REQUEST, res);

        expect(authOrchestrator.login).toHaveBeenCalledWith(MOCK_LOGIN_REQUEST);

        const expectedExpires = new Date(
          Date.now() + MOCK_REFRESH_TOKEN_EXPIRES_IN,
        );
        expect(res.cookie).toHaveBeenCalledWith(
          'refresh_token',
          MOCK_REFRESH_TOKEN,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expectedExpires,
          },
        );

        expect(result).toBe(MOCK_LOGIN_RESPONSE);
      });
    });

    describe('異常系', () => {
      it('ログインに失敗した場合', async () => {
        const errorMessage = 'ログイン情報が不正です';
        authOrchestrator.login.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );

        await expect(controller.login(MOCK_LOGIN_REQUEST, res)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(res.cookie).not.toHaveBeenCalled();
      });
    });
  });

  describe('logout', () => {
    describe('正常系', () => {
      it('ログアウトに成功すること', async () => {
        authOrchestrator.logout.mockResolvedValue(undefined);
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        const result = await controller.logout(req, res);

        expect(authOrchestrator.logout).toHaveBeenCalledWith(MOCK_AUTH_USER_ID);
        expect(res.cookie).toHaveBeenCalledWith('refresh_token', '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          expires: new Date(0),
        });

        expect(result).toBeUndefined();
      });
    });

    describe('異常系', () => {
      it('ログアウト処理に失敗した場合', async () => {
        const errorMessage = 'ログアウト処理失敗';
        authOrchestrator.logout.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        await expect(controller.logout(req, res)).rejects.toThrow(
          UnauthorizedException,
        );
      });
    });
  });

  describe('refresh', () => {
    describe('正常系', () => {
      it('トークン更新に成功して新しいアクセストークンが返り、新しいトークンがCookieに設定されること', async () => {
        authOrchestrator.refresh.mockResolvedValue(MOCK_REFRESH_RESPONSE);
        const req = mockRequest(
          MOCK_AUTH_USER_ID,
          MOCK_AUTH_USER_NAME,
        ) as Request;

        const result = await controller.refresh(req, res);

        expect(authOrchestrator.refresh).toHaveBeenCalledWith(
          MOCK_AUTH_USER_ID,
          MOCK_AUTH_USER_NAME,
        );

        const expectedExpires = new Date(
          Date.now() + MOCK_REFRESH_TOKEN_EXPIRES_IN,
        );
        expect(res.cookie).toHaveBeenCalledWith(
          'refresh_token',
          MOCK_REFRESH_RESPONSE.refreshToken,
          {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            expires: expectedExpires,
          },
        );

        expect(result).toBe(MOCK_REFRESH_RESPONSE);
      });
    });

    describe('異常系', () => {
      it('トークン更新に失敗した場合', async () => {
        const errorMessage = '無効なリフレッシュトークン';
        authOrchestrator.refresh.mockRejectedValue(
          new UnauthorizedException(errorMessage),
        );
        const req = mockRequest(
          MOCK_AUTH_USER_ID,
          MOCK_AUTH_USER_NAME,
        ) as Request;

        await expect(controller.refresh(req, res)).rejects.toThrow(
          UnauthorizedException,
        );

        expect(res.cookie).not.toHaveBeenCalled();
      });
    });
  });
});
