import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserServicesService } from './user-services.service';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { CommonService } from '../common/common.service';
import { UserServicesListRequestDto } from '../../domain/user-services/dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from '../../domain/user-services/dto/user-services-list-response.dto';
import { UserServicesDetailResponseDto } from '../../domain/user-services/dto/user-services-detail-response.dto';
import {
  SelectUserServicesDto,
  UserServicesDetailDto,
} from 'src/database/dto/user_services.dto';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { UserServicesCreateRequestDto } from 'src/domain/user-services/dto/user-services-create-request.dto';

// --- モックデータ ---
const MOCK_USER_ID = 'user-01';
const MOCK_SERVICE_ID = 'service-01';
const MOCK_USER_SERVICE_ID = 'us-001';
const MOCK_TX_DATE = new Date('2025-10-26T10:00:00Z');

const mockListRequest: UserServicesListRequestDto = {
  serviceName: 'Test Service',
  limit: 10,
  offset: 0,
};

const mockDetailDto: UserServicesDetailDto = {
  id: MOCK_USER_SERVICE_ID,
  usersId: MOCK_USER_ID,
  servicesId: MOCK_SERVICE_ID,
  services: {
    id: MOCK_SERVICE_ID,
    name: 'Test Service Name',
    description: 'Test Description',
    price: 100,
    unit: '回',
    isDeleted: false,
  },
} as unknown as UserServicesDetailDto;

const mockPaging = {
  totalCount: 1,
  limit: 10,
  offset: 0,
  totalPage: 1,
};

// 依存関係のモック
const mockUserServicesDao = {
  selectUserServices: jest.fn(),
  countUserServices: jest.fn(),
  selectUserServicesById: jest.fn(),
  createUserServices: jest.fn(),
  selectUserServicesByIds: jest.fn(),
};

const mockCommonService = {
  calcResponsePaging: jest.fn(),
};

describe('UserServicesService (Service) Test', () => {
  let service: UserServicesService;
  let dao: typeof mockUserServicesDao;
  let commonService: typeof mockCommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserServicesService,
        {
          provide: UserServicesDao,
          useValue: mockUserServicesDao,
        },
        {
          provide: CommonService,
          useValue: mockCommonService,
        },
      ],
    }).compile();

    service = module.get<UserServicesService>(UserServicesService);
    dao = module.get(UserServicesDao);
    commonService = module.get(CommonService);

    jest.clearAllMocks();
  });

  it('サービスクラスが定義されていること', () => {
    expect(service).toBeDefined();
  });

  describe('list', () => {
    describe('正常系', () => {
      it('ユーザー提供サービスのページング情報付きリストが取得できること', async () => {
        dao.selectUserServices.mockResolvedValue([mockDetailDto]);
        dao.countUserServices.mockResolvedValue(mockPaging.totalCount);
        commonService.calcResponsePaging.mockReturnValue(mockPaging);

        const result = await service.list(mockListRequest);

        const expectedSelectDto: SelectUserServicesDto = {
          servicesName: mockListRequest.serviceName,
          limit: mockListRequest.limit,
          offset: mockListRequest.offset,
        };
        expect(dao.selectUserServices).toHaveBeenCalledWith(expectedSelectDto);
        expect(dao.countUserServices).toHaveBeenCalledWith(expectedSelectDto);

        expect(commonService.calcResponsePaging).toHaveBeenCalledWith(
          mockPaging.totalCount,
          mockListRequest.offset,
          mockListRequest.limit,
        );

        expect(result).toBeInstanceOf(UserServicesListResponseDto);
        expect(result.userServices).toHaveLength(1);
        expect(result.userServices).toBeDefined();
        if (result.userServices !== undefined) {
          expect(result.userServices[0].id).toBe(MOCK_USER_SERVICE_ID);
          expect(result.userServices[0].name).toBe(mockDetailDto.services.name);
        }
        expect(result.totalCount).toBe(mockPaging.totalCount);
      });
    });

    describe('異常系', () => {
      it('検索が失敗すること', async () => {
        const mockError = new Error('DB Select error');
        dao.selectUserServices.mockRejectedValue(mockError);

        await expect(service.list(mockListRequest)).rejects.toThrow(mockError);
      });

      it('件数取得が失敗すること', async () => {
        const mockError = new Error('DB Count error');
        dao.selectUserServices.mockResolvedValue([]);
        dao.countUserServices.mockRejectedValue(mockError);

        await expect(service.list(mockListRequest)).rejects.toThrow(mockError);
      });
    });
  });

  describe('detail', () => {
    describe('正常系', () => {
      it('ユーザー提供サービスの明細が取得できること', async () => {
        dao.selectUserServicesById.mockResolvedValue(mockDetailDto);

        const result = await service.detail(MOCK_USER_SERVICE_ID);

        expect(dao.selectUserServicesById).toHaveBeenCalledWith(
          MOCK_USER_SERVICE_ID,
        );
        expect(result.id).toBe(MOCK_USER_SERVICE_ID);
        expect(result.name).toBe(mockDetailDto.services.name);

        // レスポンスの型確認
        expect(result).toBeInstanceOf(UserServicesDetailResponseDto);
      });
    });

    describe('異常系', () => {
      it('ユーザー提供サービスが取得できないこと', async () => {
        dao.selectUserServicesById.mockResolvedValue(null);

        await expect(service.detail('non-existent-id')).rejects.toThrow(
          NotFoundException,
        );
        await expect(service.detail('non-existent-id')).rejects.toThrow(
          'ユーザー提供サービスが見つかりません',
        );
      });

      it('DBエラーが発生すること', async () => {
        const mockError = new Error('DB Detail error');
        dao.selectUserServicesById.mockRejectedValue(mockError);

        await expect(service.detail(MOCK_USER_SERVICE_ID)).rejects.toThrow(
          mockError,
        );
      });
    });
  });

  describe('createWithTx', () => {
    const mockCreateRequest: UserServicesCreateRequestDto = {
      userId: MOCK_USER_ID,
      serviceId: MOCK_SERVICE_ID,
      stock: 100,
    };
    const mockPrismaTx: PrismaTransaction = {} as PrismaTransaction;

    describe('正常系', () => {
      it('ユーザー提供サービスのレコードが作成できること', async () => {
        const createdRecord = { id: 'new-id-123' };
        dao.createUserServices.mockResolvedValue(createdRecord);

        const result = await service.createWithTx(
          mockPrismaTx,
          MOCK_USER_ID,
          MOCK_TX_DATE,
          mockCreateRequest,
        );

        expect(dao.createUserServices).toHaveBeenCalledWith(
          mockPrismaTx,
          expect.objectContaining({
            usersId: mockCreateRequest.userId,
            servicesId: mockCreateRequest.serviceId,
            stock: mockCreateRequest.stock,
            registeredBy: MOCK_USER_ID,
            registeredAt: MOCK_TX_DATE,
            isDeleted: false,
          }),
        );

        expect(result).toBe(createdRecord.id);
      });
    });

    describe('異常系', () => {
      it('ユーザー提供サービスのレコード作成が失敗すること', async () => {
        dao.createUserServices.mockResolvedValue(null);

        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow(InternalServerErrorException);
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow('ユーザー提供サービス登録に失敗しました');
      });

      it('ユーザー提供サービスの登録に失敗すること', async () => {
        // Setup
        const mockError = new Error('DB Insert error');
        dao.createUserServices.mockRejectedValue(mockError);

        // Execute & Assert
        await expect(
          service.createWithTx(
            mockPrismaTx,
            MOCK_USER_ID,
            MOCK_TX_DATE,
            mockCreateRequest,
          ),
        ).rejects.toThrow(mockError);
      });
    });
  });

  describe('isUserServiceExists', () => {
    describe('正常系', () => {
      it('ユーザー提供サービスが存在することを確認する', async () => {
        dao.selectUserServicesByIds.mockResolvedValue(mockDetailDto);

        const result = await service.isUserServiceExists(
          MOCK_USER_ID,
          MOCK_SERVICE_ID,
        );

        expect(dao.selectUserServicesByIds).toHaveBeenCalledWith(
          MOCK_USER_ID,
          MOCK_SERVICE_ID,
        );
        expect(result).toBe(true);
      });

      it('ユーザー提供サービスが存在しないことを確認する', async () => {
        dao.selectUserServicesByIds.mockResolvedValue(null);

        const result = await service.isUserServiceExists(
          MOCK_USER_ID,
          MOCK_SERVICE_ID,
        );

        expect(dao.selectUserServicesByIds).toHaveBeenCalledWith(
          MOCK_USER_ID,
          MOCK_SERVICE_ID,
        );
        expect(result).toBe(false);
      });
    });

    describe('異常系', () => {
      it('ユーザー提供サービスの存在チェックに失敗すること', async () => {
        const mockError = new Error('DB Check error');
        dao.selectUserServicesByIds.mockRejectedValue(mockError);

        // Execute & Assert
        await expect(
          service.isUserServiceExists(MOCK_USER_ID, MOCK_SERVICE_ID),
        ).rejects.toThrow(mockError);
      });
    });
  });
});
