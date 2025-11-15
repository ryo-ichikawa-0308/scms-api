/* eslint-disable @typescript-eslint/no-unsafe-call */
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersDao } from 'src/database/dao/users.dao';
import { AccessTokenStrategy } from './strategy/access-token.strategy';
import { RefreshTokenStrategy } from './strategy/refresh-token.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { Users } from '@prisma/client';
import { AuthLoginResponseDto } from 'src/domain/auth/dto/auth-login-response.dto';
import { AuthRefreshResponseDto } from 'src/domain/auth/dto/auth-refresh-response.dto';
import * as bcrypt from 'bcrypt';

// bcryptのモック
jest.mock('bcrypt', () => {
  return {
    compare: jest.fn(),
    genSalt: jest.fn(),
    hash: jest.fn(),
  };
});

// --- モックデータ ---
const MOCK_USER_ID = 'test-user-id';
const MOCK_USER_EMAIL = 'test@example.com';
const MOCK_USERNAME = 'test-user-name';
const MOCK_RAW_PASSWORD = 'password123';
const MOCK_HASHED_PASSWORD = 'hashed-password-xyz';
const MOCK_ACCESS_TOKEN = 'mock-access-token';
const MOCK_REFRESH_TOKEN = 'mock-refresh-token';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');
const MOCK_PRISMATX: PrismaTransaction = {} as PrismaTransaction;
const MOCK_ACCESS_TOKEN_EXPIRES = 3600;
const MOCK_REFRESH_TOKEN_EXPIRES = 86400;
const SALT_ROUNDS = 10;

const MOCK_USER: Users = {
  id: MOCK_USER_ID,
  name: MOCK_USERNAME,
  email: MOCK_USER_EMAIL,
  password: MOCK_HASHED_PASSWORD,
  token: null,
  registeredAt: MOCK_TX_DATE,
  registeredBy: 'system',
  updatedAt: null,
  updatedBy: null,
  isDeleted: false,
} as Users;

// 依存関係のモック
const mockUsersDao = {
  selectUsersById: jest.fn(),
  lockUsersById: jest.fn(),
  updateUsers: jest.fn(),
  selectUsersByEmail: jest.fn(),
};

const mockAccessTokenStrategy = {
  generateAccessToken: jest.fn(),
};

const mockRefreshTokenStrategy = {
  generateRefreshToken: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn(),
};

describe('AuthService (Service) Test', () => {
  let service: AuthService;
  let usersDao: typeof mockUsersDao;
  let accessTokenStrategy: typeof mockAccessTokenStrategy;
  let refreshTokenStrategy: typeof mockRefreshTokenStrategy;
  let configService: typeof mockConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersDao, useValue: mockUsersDao },
        {
          provide: AccessTokenStrategy,
          useValue: mockAccessTokenStrategy,
        },
        {
          provide: RefreshTokenStrategy,
          useValue: mockRefreshTokenStrategy,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersDao = module.get(UsersDao);
    accessTokenStrategy = module.get(AccessTokenStrategy);
    refreshTokenStrategy = module.get(RefreshTokenStrategy);
    configService = module.get(ConfigService);

    jest.clearAllMocks();

    // 環境変数取得をモック
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'ACCESS_TOKEN_EXPIRES') return MOCK_ACCESS_TOKEN_EXPIRES;
      if (key === 'REFRESH_TOKEN_EXPIRES') return MOCK_REFRESH_TOKEN_EXPIRES;
      return null;
    });
  });

  it('サービスクラスが定義されていること', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithTx', () => {
    describe('正常系', () => {
      it('ログインに成功してアクセストークンが返却される', async () => {
        const userWithNullToken = { ...MOCK_USER, token: null };
        const userAfterLock = { ...MOCK_USER, token: null };

        usersDao.selectUsersById.mockResolvedValue(userWithNullToken);
        refreshTokenStrategy.generateRefreshToken.mockReturnValue(
          MOCK_REFRESH_TOKEN,
        );
        usersDao.lockUsersById.mockResolvedValue(userAfterLock);
        accessTokenStrategy.generateAccessToken.mockReturnValue(
          MOCK_ACCESS_TOKEN,
        );

        const result = await service.loginWithTx(
          MOCK_PRISMATX,
          MOCK_TX_DATE,
          MOCK_USER_ID,
        );

        expect(usersDao.selectUsersById).toHaveBeenCalledWith(MOCK_USER_ID);
        expect(refreshTokenStrategy.generateRefreshToken).toHaveBeenCalledWith(
          MOCK_USER_ID,
          MOCK_USERNAME,
        );
        expect(usersDao.lockUsersById).toHaveBeenCalledWith(
          MOCK_PRISMATX,
          MOCK_USER_ID,
        );
        expect(usersDao.updateUsers).toHaveBeenCalledWith(
          MOCK_PRISMATX,
          expect.objectContaining({
            token: MOCK_REFRESH_TOKEN,
            updatedAt: MOCK_TX_DATE,
          }),
        );
        expect(accessTokenStrategy.generateAccessToken).toHaveBeenCalledWith(
          MOCK_USER_ID,
          MOCK_USERNAME,
        );

        expect(result).toBeInstanceOf(AuthLoginResponseDto);
        expect(result.id).toBe(MOCK_USER_ID);
        expect(result.token.accessToken).toBe(MOCK_ACCESS_TOKEN);
        expect(result.token.expiresIn).toBe(MOCK_ACCESS_TOKEN_EXPIRES);
        expect(result.refreshToken).toBe(MOCK_REFRESH_TOKEN);
        expect(result.refreshTokenExpiresIn).toBe(MOCK_REFRESH_TOKEN_EXPIRES);
      });
    });

    describe('異常系', () => {
      it('ユーザー情報が取得できない場合', async () => {
        usersDao.selectUsersById.mockResolvedValue(null);

        await expect(
          service.loginWithTx(MOCK_PRISMATX, MOCK_TX_DATE, MOCK_USER_ID),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.loginWithTx(MOCK_PRISMATX, MOCK_TX_DATE, MOCK_USER_ID),
        ).rejects.toThrow('ユーザー情報が存在しません');
      });

      it('ユーザーテーブルのロックを取得できない場合', async () => {
        usersDao.selectUsersById.mockResolvedValue(MOCK_USER);
        refreshTokenStrategy.generateRefreshToken.mockReturnValue(
          MOCK_REFRESH_TOKEN,
        );
        usersDao.lockUsersById.mockResolvedValue(null);

        await expect(
          service.loginWithTx(MOCK_PRISMATX, MOCK_TX_DATE, MOCK_USER_ID),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.loginWithTx(MOCK_PRISMATX, MOCK_TX_DATE, MOCK_USER_ID),
        ).rejects.toThrow('ユーザー情報が存在しません');
      });
    });
  });

  describe('logoutWithTx', () => {
    describe('正常系', () => {
      it('ログアウトに成功してリフレッシュトークンが無効化されること', async () => {
        const userWithToken = { ...MOCK_USER, token: MOCK_REFRESH_TOKEN };
        usersDao.lockUsersById.mockResolvedValue(userWithToken);

        const result = await service.logoutWithTx(
          MOCK_PRISMATX,
          MOCK_USER_ID,
          MOCK_TX_DATE,
        );

        expect(usersDao.lockUsersById).toHaveBeenCalledWith(
          MOCK_PRISMATX,
          MOCK_USER_ID,
        );
        expect(usersDao.updateUsers).toHaveBeenCalledWith(
          MOCK_PRISMATX,
          expect.objectContaining({
            token: null,
            updatedAt: MOCK_TX_DATE,
            updatedBy: MOCK_USER_ID,
          }),
        );
        expect(result).toBe(true);
      });
    });

    describe('異常系', () => {
      it('ユーザーテーブルのロックを取得できない場合', async () => {
        usersDao.lockUsersById.mockResolvedValue(null);

        await expect(
          service.logoutWithTx(MOCK_PRISMATX, MOCK_USER_ID, MOCK_TX_DATE),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.logoutWithTx(MOCK_PRISMATX, MOCK_USER_ID, MOCK_TX_DATE),
        ).rejects.toThrow('ユーザー情報が存在しません');
      });
    });
  });

  describe('refreshWithTx', () => {
    describe('正常系', () => {
      it('アクセストークンのリフレッシュが成功すること', async () => {
        const NEW_REFRESH_TOKEN = 'new-mock-refresh-token';
        usersDao.lockUsersById.mockResolvedValue(MOCK_USER);
        refreshTokenStrategy.generateRefreshToken.mockReturnValue(
          NEW_REFRESH_TOKEN,
        );
        accessTokenStrategy.generateAccessToken.mockReturnValue(
          MOCK_ACCESS_TOKEN,
        );

        const result = await service.refreshWithTx(
          MOCK_PRISMATX,
          MOCK_TX_DATE,
          MOCK_USER_ID,
          MOCK_USERNAME,
        );

        expect(refreshTokenStrategy.generateRefreshToken).toHaveBeenCalledWith(
          MOCK_USER_ID,
          MOCK_USERNAME,
        );
        expect(usersDao.lockUsersById).toHaveBeenCalledWith(
          MOCK_PRISMATX,
          MOCK_USER_ID,
        );
        expect(usersDao.updateUsers).toHaveBeenCalledWith(
          MOCK_PRISMATX,
          expect.objectContaining({
            token: NEW_REFRESH_TOKEN,
            updatedAt: MOCK_TX_DATE,
          }),
        );
        expect(accessTokenStrategy.generateAccessToken).toHaveBeenCalledWith(
          MOCK_USER_ID,
          MOCK_USERNAME,
        );

        expect(result).toBeInstanceOf(AuthRefreshResponseDto);
        expect(result.token.accessToken).toBe(MOCK_ACCESS_TOKEN);
        expect(result.token.expiresIn).toBe(MOCK_ACCESS_TOKEN_EXPIRES);
        expect(result.refreshToken).toBe(NEW_REFRESH_TOKEN);
        expect(result.refreshTokenExpiresIn).toBe(MOCK_REFRESH_TOKEN_EXPIRES);
      });
    });

    describe('異常系', () => {
      it('ユーザーテーブルのロックを取得できない場合', async () => {
        usersDao.lockUsersById.mockResolvedValue(null);

        await expect(
          service.refreshWithTx(
            MOCK_PRISMATX,
            MOCK_TX_DATE,
            MOCK_USER_ID,
            MOCK_USERNAME,
          ),
        ).rejects.toThrow(NotFoundException);
        await expect(
          service.refreshWithTx(
            MOCK_PRISMATX,
            MOCK_TX_DATE,
            MOCK_USER_ID,
            MOCK_USERNAME,
          ),
        ).rejects.toThrow('ユーザー情報が存在しません');
      });
    });
  });

  describe('getUserId', () => {
    describe('正常系', () => {
      it('メールアドレスとパスワードで認証できること', async () => {
        usersDao.selectUsersByEmail.mockResolvedValue(MOCK_USER);
        // @ts-expect-error: bcryptのモックに戻り値設定するためエラー回避
        bcrypt.compare.mockResolvedValue(true);

        const result = await service.getUserId(
          MOCK_USER_EMAIL,
          MOCK_RAW_PASSWORD,
        );

        expect(usersDao.selectUsersByEmail).toHaveBeenCalledWith(
          MOCK_USER_EMAIL,
        );
        expect(bcrypt.compare).toHaveBeenCalledWith(
          MOCK_RAW_PASSWORD,
          MOCK_HASHED_PASSWORD,
        );
        expect(result).toBe(MOCK_USER_ID);
      });
    });

    describe('異常系', () => {
      it('メールアドレスが登録されていない場合', async () => {
        usersDao.selectUsersByEmail.mockResolvedValue(null);

        await expect(
          service.getUserId(MOCK_USER_EMAIL, MOCK_RAW_PASSWORD),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.getUserId(MOCK_USER_EMAIL, MOCK_RAW_PASSWORD),
        ).rejects.toThrow('認証情報が無効です');
        expect(bcrypt.compare).not.toHaveBeenCalled();
      });

      it('パスワード認証に失敗', async () => {
        usersDao.selectUsersByEmail.mockResolvedValue(MOCK_USER);
        // @ts-expect-error: bcryptのモックに戻り値設定するためエラー回避
        bcrypt.compare.mockResolvedValue(false);

        await expect(
          service.getUserId(MOCK_USER_EMAIL, 'wrong-password'),
        ).rejects.toThrow(UnauthorizedException);
        await expect(
          service.getUserId(MOCK_USER_EMAIL, 'wrong-password'),
        ).rejects.toThrow('認証情報が無効です');
        expect(bcrypt.compare).toHaveBeenCalled();
      });
    });
  });

  describe('getPasswordHash', () => {
    describe('正常系', () => {
      it('パスワードのハッシュを返すこと', async () => {
        const mockSalt = 'mock-salt-abc';
        // @ts-expect-error: bcryptのモックに戻り値設定するためエラー回避
        bcrypt.genSalt.mockResolvedValue(mockSalt);
        // @ts-expect-error: bcryptのモックに戻り値設定するためエラー回避
        bcrypt.hash.mockResolvedValue(MOCK_HASHED_PASSWORD);

        const result = await service.getPasswordHash(MOCK_RAW_PASSWORD);

        expect(bcrypt.genSalt).toHaveBeenCalledWith(SALT_ROUNDS);
        expect(bcrypt.hash).toHaveBeenCalledWith(MOCK_RAW_PASSWORD, mockSalt);
        expect(result).toBe(MOCK_HASHED_PASSWORD);
      });
    });
  });

  describe('validatePassword', () => {
    describe('正常系', () => {
      it('ハッシュの照合に成功した場合', async () => {
        // @ts-expect-error: bcryptのモックに戻り値設定するためエラー回避
        bcrypt.compare.mockResolvedValue(true);

        const result = await service.validatePassword(
          MOCK_RAW_PASSWORD,
          MOCK_HASHED_PASSWORD,
        );

        expect(bcrypt.compare).toHaveBeenCalledWith(
          MOCK_RAW_PASSWORD,
          MOCK_HASHED_PASSWORD,
        );
        expect(result).toBe(true);
      });
      it('ハッシュの照合に失敗した場合', async () => {
        // @ts-expect-error: bcryptのモックに戻り値設定するためエラー回避
        bcrypt.compare.mockResolvedValue(false);

        const result = await service.validatePassword(
          MOCK_RAW_PASSWORD,
          MOCK_HASHED_PASSWORD,
        );

        expect(bcrypt.compare).toHaveBeenCalledWith(
          MOCK_RAW_PASSWORD,
          MOCK_HASHED_PASSWORD,
        );
        expect(result).toBe(false);
      });
    });
  });
});
