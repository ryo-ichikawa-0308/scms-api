import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenStrategy } from './access-token.strategy';
import { UsersDao } from 'src/database/dao/users.dao';
import { JwtPayload } from './jwt-payload';

// --- モックデータ ---
const MOCK_USER_ID = 'test-user-id';
const MOCK_USERNAME = 'test-username';
const MOCK_PAYLOAD: JwtPayload = {
  userId: MOCK_USER_ID,
  username: MOCK_USERNAME,
};

// 依存関係のモック
const mockUsersDao = {
  selectUsersById: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('MOCK_ACCESS_TOKEN_SECRET'),
};

describe('AccessTokenStrategy (Passport Strategy) Test', () => {
  let strategy: AccessTokenStrategy;
  let usersDao: typeof mockUsersDao;
  let jwtService: typeof mockJwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessTokenStrategy,
        { provide: UsersDao, useValue: mockUsersDao },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    strategy = module.get<AccessTokenStrategy>(AccessTokenStrategy);
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
        usersDao.selectUsersById.mockResolvedValue({ id: MOCK_USER_ID });

        const result = await strategy.validate(MOCK_PAYLOAD);

        expect(usersDao.selectUsersById).toHaveBeenCalledWith(MOCK_USER_ID);
        expect(result).toEqual({
          userId: MOCK_PAYLOAD.userId,
          username: MOCK_PAYLOAD.username,
        });
      });
    });

    describe('異常系', () => {
      it('ユーザーテーブルにユーザーが登録されていない', async () => {
        usersDao.selectUsersById.mockResolvedValue(null);

        await expect(strategy.validate(MOCK_PAYLOAD)).rejects.toThrow(
          UnauthorizedException,
        );
        await expect(strategy.validate(MOCK_PAYLOAD)).rejects.toThrow(
          'このユーザーは認証されていません',
        );
        expect(usersDao.selectUsersById).toHaveBeenCalledWith(MOCK_USER_ID);
      });

      it('DBエラー', async () => {
        const mockError = new Error('DB connection failed');
        usersDao.selectUsersById.mockRejectedValue(mockError);

        await expect(strategy.validate(MOCK_PAYLOAD)).rejects.toThrow(
          mockError,
        );
        expect(usersDao.selectUsersById).toHaveBeenCalledWith(MOCK_USER_ID);
      });
    });
  });

  describe('generateAccessToken', () => {
    const GENERATED_TOKEN = 'mock.generated.token.12345';
    describe('正常系', () => {
      it('JWTトークンが生成できること', () => {
        jwtService.sign.mockReturnValue(GENERATED_TOKEN);

        const result = strategy.generateAccessToken(
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
          strategy.generateAccessToken(MOCK_USER_ID, MOCK_USERNAME),
        ).toThrow(mockError);
      });
    });
  });
});
