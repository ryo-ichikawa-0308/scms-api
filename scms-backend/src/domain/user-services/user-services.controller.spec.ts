import { Test, TestingModule } from '@nestjs/testing';
import { UserServicesController } from './user-services.controller';
import { UserServicesService } from '../../service/user-services/user-services.service';
import { UserServicesOrchestrator } from './user-services.orchestrator';
import { AuthGuard } from '@nestjs/passport';
import { UserServicesListRequestDto } from './dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from './dto/user-services-list-response.dto';
import { UserServicesDetailPathParamsDto } from './dto/user-services-detail-pathparams.dto';
import { UserServicesDetailResponseDto } from './dto/user-services-detail-response.dto';
import { UserServicesCreateRequestDto } from './dto/user-services-create-request.dto';
import {
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  CanActivate,
} from '@nestjs/common';
import type { Request } from 'express';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_LIST_REQUEST: UserServicesListRequestDto = {
  serviceName: 'サービス',
  sort: 'id',
  order: 'asc',
} as UserServicesListRequestDto;
const MOCK_LIST_RESPONSE: UserServicesListResponseDto = {
  userServices: [
    {
      id: 'us-001',
      usersId: 'u-001',
      servicesId: 's-001',
      name: 'サービス',
      price: 100,
      description: 'サービスの概要',
      unit: '点',
    },
  ],
  totalCount: 1,
  totalPages: 0,
  currentPage: 0,
  offset: 0,
  limit: 0,
};
const MOCK_DETAIL_ID = 'detail-id-789';
const MOCK_DETAIL_PATH_PARAMS: UserServicesDetailPathParamsDto = {
  id: MOCK_DETAIL_ID,
};
const MOCK_DETAIL_RESPONSE: UserServicesDetailResponseDto = {
  id: MOCK_DETAIL_ID,
  usersId: 'u-001',
  servicesId: 's-001',
  name: 'サービス',
  price: 100,
  description: 'サービスの概要',
  unit: '点',
};
const MOCK_CREATE_REQUEST: UserServicesCreateRequestDto = {
  userId: 'u-002',
  serviceId: 's-002',
  stock: 5,
};
const MOCK_CREATED_ID = 'new-user-service-id-456';

// 依存関係のモック
const mockUserServicesService = {
  list: jest.fn(),
  detail: jest.fn(),
};

const mockUserServicesOrchestrator = {
  create: jest.fn(),
};

const mockAuthGuard: CanActivate = {
  canActivate: jest.fn(() => true),
};

// 認証済みリクエストのモック関数
const mockRequest = (userId: string | undefined): Partial<Request> => ({
  user: { userId: userId ?? '', username: 'test' },
});

describe('UserServicesController (Controller) Test', () => {
  let controller: UserServicesController;
  let userServicesService: typeof mockUserServicesService;
  let userServicesOrchestrator: typeof mockUserServicesOrchestrator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserServicesController],
      providers: [
        {
          provide: UserServicesService,
          useValue: mockUserServicesService,
        },
        {
          provide: UserServicesOrchestrator,
          useValue: mockUserServicesOrchestrator,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<UserServicesController>(UserServicesController);
    userServicesService = module.get(UserServicesService);
    userServicesOrchestrator = module.get(UserServicesOrchestrator);

    jest.clearAllMocks();
  });

  it('コントローラークラスが定義されていること', () => {
    expect(controller).toBeDefined();
  });

  describe('list', () => {
    describe('正常系 (POST /user-services/list)', () => {
      it('ユーザー提供サービスのリストが取得できること', async () => {
        userServicesService.list.mockResolvedValue(MOCK_LIST_RESPONSE);

        const result = await controller.list(MOCK_LIST_REQUEST);

        expect(userServicesService.list).toHaveBeenCalledWith(
          MOCK_LIST_REQUEST,
        );
        expect(result).toBe(MOCK_LIST_RESPONSE);
      });
    });

    describe('異常系', () => {
      it('DBエラー', async () => {
        userServicesService.list.mockRejectedValue(
          new InternalServerErrorException('DB Error'),
        );

        await expect(controller.list(MOCK_LIST_REQUEST)).rejects.toThrow(
          InternalServerErrorException,
        );
        await expect(controller.list(MOCK_LIST_REQUEST)).rejects.toThrow(
          'DB Error',
        );
      });
    });
  });

  describe('detail', () => {
    describe('正常系 (GET /user-services/:id)', () => {
      it('ユーザー提供サービスの明細が取得できること', async () => {
        userServicesService.detail.mockResolvedValue(MOCK_DETAIL_RESPONSE);

        const result = await controller.detail(MOCK_DETAIL_PATH_PARAMS);

        expect(userServicesService.detail).toHaveBeenCalledWith(MOCK_DETAIL_ID);
        expect(result).toBe(MOCK_DETAIL_RESPONSE);
      });
    });

    describe('異常系', () => {
      it('明細が取得できない場合', async () => {
        userServicesService.detail.mockRejectedValue(
          new NotFoundException('サービスが見つかりません'),
        );

        await expect(
          controller.detail(MOCK_DETAIL_PATH_PARAMS),
        ).rejects.toThrow(NotFoundException);
        await expect(
          controller.detail(MOCK_DETAIL_PATH_PARAMS),
        ).rejects.toThrow('サービスが見つかりません');
      });
    });
  });

  describe('create', () => {
    describe('正常系 (POST /user-services)', () => {
      it('ユーザー提供サービスのレコードが作成できること', async () => {
        userServicesOrchestrator.create.mockResolvedValue(MOCK_CREATED_ID);
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        const result = await controller.create(MOCK_CREATE_REQUEST, req);

        expect(userServicesOrchestrator.create).toHaveBeenCalledWith(
          MOCK_CREATE_REQUEST,
          MOCK_AUTH_USER_ID,
        );
        expect(result).toBe(MOCK_CREATED_ID);
      });
    });

    describe('異常系', () => {
      it('ユーザーとサービスのID組み合わせが被った場合', async () => {
        const errorMessage = 'このユーザー提供サービスは登録できません';
        userServicesOrchestrator.create.mockRejectedValue(
          new ConflictException(errorMessage),
        );
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        try {
          await controller.create(MOCK_CREATE_REQUEST, req);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(userServicesOrchestrator.create).toHaveBeenCalledTimes(1);
          expect(error).toBeInstanceOf(ConflictException);
          expect((error as ConflictException).message).toBe(errorMessage);
        }
      });
      it('DBエラー', async () => {
        userServicesOrchestrator.create.mockRejectedValue(
          new InternalServerErrorException('Orchestrator failed'),
        );
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        await expect(
          controller.create(MOCK_CREATE_REQUEST, req),
        ).rejects.toThrow(InternalServerErrorException);
      });
    });
  });
});
