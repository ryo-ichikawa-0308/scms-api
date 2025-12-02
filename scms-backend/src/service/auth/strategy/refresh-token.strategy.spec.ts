import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { RefreshTokenStrategy } from './refresh-token.strategy';
import { UsersDao } from 'src/database/dao/users.dao';
import { JwtPayload } from '../../../types/jwt-payload';
import { Users } from '@prisma/client';

// --- モックデータ ---
const MOCK_USER_ID = 'test-user-id';
const MOCK_USERNAME = 'test-username';
const MOCK_PAYLOAD: JwtPayload = {
  userId: MOCK_USER_ID,
  username: MOCK_USERNAME,
};
const MOCK_REFRESH_TOKEN = 'mock.refresh.token.abcdefg';
const MOCK_AUTH_HEADER = `refresh_token=${MOCK_REFRESH_TOKEN}`;

// ユーザーレコードのモック
const mockUserRecord: Partial<Users> = {
  id: MOCK_USER_ID,
  token: MOCK_REFRESH_TOKEN,
} as Partial<Users>;

// リクエストのモック
const createMockRequest = (cookie: string | undefined): Request =>
  ({
    headers: { cookie },
  }) as unknown as Request;

// 依存関係のモック
const mockUsersDao = {
  selectUsersById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn((key: string) => {
    if (key === 'REFRESH_TOKEN_KEY') {
      return 'refresh_token';
    } else if (key === 'REFRESH_TOKEN_SECRET') {
      return 'mock-refresh-token-secret';
    }
    return null;
  }),
};

describe('RefreshTokenStrategy (Passport Strategy) Test', () => {
  let strategy: RefreshTokenStrategy;
  let usersDao: typeof mockUsersDao;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenStrategy,
        { provide: UsersDao, useValue: mockUsersDao },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<RefreshTokenStrategy>(RefreshTokenStrategy);
    usersDao = module.get(UsersDao);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  it('ストラテジークラスが定義されていること', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    describe('正常系', () => {
      it('ユーザー認証に成功してJWTのペイロードを返すこと', async () => {
        usersDao.selectUsersById.mockResolvedValue(mockUserRecord);
        const req = createMockRequest(MOCK_AUTH_HEADER);

        const result = await strategy.validate(req, MOCK_PAYLOAD);

        expect(usersDao.selectUsersById).toHaveBeenCalledWith(MOCK_USER_ID);
        expect(result).toEqual({
          userId: MOCK_PAYLOAD.userId,
          username: MOCK_PAYLOAD.username,
        });
      });
    });

    describe('異常系', () => {
      it('Cookieが見つからない場合', async () => {
        const req = createMockRequest(undefined);

        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          '無効なリフレッシュトークン形式です。',
        );
        expect(usersDao.selectUsersById).not.toHaveBeenCalled();
      });

      it('トークン形式が無効', async () => {
        const req = createMockRequest('invalid_token_format');

        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          '無効なリフレッシュトークン形式です。',
        );
        expect(usersDao.selectUsersById).not.toHaveBeenCalled();
      });

      it('ユーザーテーブルにユーザーが登録されていない', async () => {
        usersDao.selectUsersById.mockResolvedValue(null);
        const req = createMockRequest(MOCK_AUTH_HEADER);

        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          'このユーザーは認証されていません',
        );
      });

      it('DBにトークン未登録', async () => {
        const userWithoutToken: Partial<Users> = {
          ...mockUserRecord,
          token: null,
        };
        usersDao.selectUsersById.mockResolvedValue(userWithoutToken);
        const req = createMockRequest(MOCK_AUTH_HEADER);

        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          'このユーザーは認証されていません',
        );
      });

      it('DB登録のトークンと一致しない', async () => {
        const userWithMismatchToken: Partial<Users> = {
          ...mockUserRecord,
          token: 'mismatch-token',
        };
        usersDao.selectUsersById.mockResolvedValue(userWithMismatchToken);
        const req = createMockRequest(MOCK_AUTH_HEADER);

        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(req, MOCK_PAYLOAD)).rejects.toThrow(
          'このユーザーは認証されていません',
        );
      });
    });
  });

  describe('generateRefreshToken', () => {
    const GENERATED_TOKEN = 'mock.generated.token.12345';
    describe('正常系', () => {
      it('JWTトークンが生成できること', () => {
        jwtService.sign.mockReturnValue(GENERATED_TOKEN);

        const result = strategy.generateRefreshToken(
          MOCK_USER_ID,
          MOCK_USERNAME,
        );

        expect(jwtService.sign).toHaveBeenCalledWith({
          userId: MOCK_USER_ID,
          username: MOCK_USERNAME,
        });
        expect(result).toBe(GENERATED_TOKEN);
      });
    });

    describe('異常系', () => {
      it('JWTトークンの生成が失敗すること', () => {
        const mockError = new Error('JWT signing failed');
        jwtService.sign.mockImplementation(() => {
          throw mockError;
        });

        expect(() =>
          strategy.generateRefreshToken(MOCK_USER_ID, MOCK_USERNAME),
        ).toThrow(mockError);
      });
    });
  });
});
