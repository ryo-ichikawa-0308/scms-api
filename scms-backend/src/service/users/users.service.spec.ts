import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersDao } from 'src/database/dao/users.dao';
import { AuthService } from '../auth/auth.service';
import { UsersCreateRequestDto } from '../../domain/users/dto/users-create-request.dto';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { CreateUsersDto } from 'src/database/dto/users.dto';

const MOCK_AUTH_USER_ID = '91234567-b996-484d-b08e-59996614138e';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');
const MOCK_PASSWORD_RAW = 'rawpassword123';
const MOCK_PASSWORD_HASHED = 'hashedpassword098';
const CREATED_USER_ID = '00000000-0000-0000-0000-000000000001';

// 引数と戻り値のモック

const mockRequestDto: UsersCreateRequestDto = {
  name: 'New User',
  email: 'newuser@test.com',
  password: MOCK_PASSWORD_RAW,
};

const mockCreatedUserRecord = {
  id: CREATED_USER_ID,
  name: mockRequestDto.name,
  email: mockRequestDto.email,
  password: MOCK_PASSWORD_HASHED,
};

const mockPrismaTx: PrismaTransaction = {} as PrismaTransaction;

// 依存関係のモック
const mockUsersDao = {
  createUsers: jest.fn(),
  selectUsersByEmail: jest.fn(),
};

const mockAuthService = {
  getPasswordHash: jest.fn(),
};

describe('UsersService (Service) Test', () => {
  let service: UsersService;
  let usersDao: typeof mockUsersDao;
  let authService: typeof mockAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersDao,
          useValue: mockUsersDao,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersDao = module.get(UsersDao);
    authService = module.get(AuthService);

    jest.clearAllMocks();

    mockAuthService.getPasswordHash.mockResolvedValue(MOCK_PASSWORD_HASHED);
    mockUsersDao.createUsers.mockResolvedValue(mockCreatedUserRecord);
  });

  it('サービスクラスが定義されていること', () => {
    expect(service).toBeDefined();
  });

  describe('createWithTx', () => {
    describe('正常系', () => {
      it('パスワードをハッシュ化して、ユーザー登録が行えること', async () => {
        const result = await service.createWithTx(
          mockPrismaTx,
          MOCK_AUTH_USER_ID,
          MOCK_TX_DATE,
          mockRequestDto,
        );

        expect(authService.getPasswordHash).toHaveBeenCalledWith(
          mockRequestDto.password,
        );

        const expectedCreateDto: CreateUsersDto = {
          id: MOCK_AUTH_USER_ID,
          name: mockRequestDto.name,
          email: mockRequestDto.email,
          password: MOCK_PASSWORD_HASHED,
          registeredBy: MOCK_AUTH_USER_ID,
          registeredAt: MOCK_TX_DATE,
        };
        expect(usersDao.createUsers).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining(expectedCreateDto),
        );

        expect(result).toBe(CREATED_USER_ID);
      });
    });
    describe('異常系', () => {
      it('ユーザー登録に失敗した場合', async () => {
        mockUsersDao.createUsers.mockResolvedValue(null);
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_AUTH_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow(InternalServerErrorException);
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_AUTH_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow('ユーザー登録に失敗しました');
      });

      it('パスワードハッシュ作成に失敗した場合', async () => {
        const mockError = new Error('Hashing failed');
        mockAuthService.getPasswordHash.mockRejectedValue(mockError);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_AUTH_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow(mockError);

        expect(usersDao.createUsers).not.toHaveBeenCalled();
      });

      it('DBエラーが発生した場合', async () => {
        const mockError = new Error('Database integrity error');
        mockUsersDao.createUsers.mockRejectedValue(mockError);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_AUTH_USER_ID,
            MOCK_TX_DATE,
            mockRequestDto,
          ),
        ).rejects.toThrow(mockError);
      });
    });
  });
  describe('isEmailExists', () => {
    const testEmail = 'check@test.com';
    describe('正常系', () => {
      it('メールアドレスに紐づくユーザーが存在する場合、例外送出すること', async () => {
        mockUsersDao.selectUsersByEmail.mockResolvedValue(
          mockCreatedUserRecord,
        );
        try {
          await service.isValidEmail(testEmail);
          fail('例外検出できなかったのでテスト失敗');
        } catch (e) {
          expect(usersDao.selectUsersByEmail).toHaveBeenCalledWith(testEmail);
          expect(e).toBeInstanceOf(ConflictException);
          expect((e as ConflictException).message).toBe(
            'このユーザーは登録できません',
          );
        }
      });

      it('メールアドレスに紐づくユーザーが存在しない場合、例外送出しないこと', async () => {
        mockUsersDao.selectUsersByEmail.mockResolvedValue(null);
        await expect(service.isValidEmail(testEmail)).resolves.not.toThrow(
          ConflictException,
        );
      });
    });

    describe('異常系', () => {
      it('DBエラーが発生した場合', async () => {
        const mockError = new Error('DAO connection error');
        mockUsersDao.selectUsersByEmail.mockRejectedValue(mockError);

        await expect(service.isValidEmail(testEmail)).rejects.toThrow(
          mockError,
        );
      });
    });
  });
});
