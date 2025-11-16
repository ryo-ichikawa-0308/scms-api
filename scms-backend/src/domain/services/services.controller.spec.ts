import { Test, TestingModule } from '@nestjs/testing';
import { ServicesController } from './services.controller';
import { ServicesOrchestrator } from './services.orchestrator';
import { AuthGuard } from '@nestjs/passport';
import { ServicesCreateRequestDto } from './dto/services-create-request.dto';
import {
  InternalServerErrorException,
  ConflictException,
  CanActivate,
} from '@nestjs/common';
import type { Request } from 'express';
import { fail } from 'assert';

// --- モックデータ ---
const MOCK_AUTH_USER_ID = 'auth-user-id-001';
const MOCK_CREATE_REQUEST: ServicesCreateRequestDto = {
  name: 'New Service',
  price: 1000,
  description: '',
  unit: '',
};
const MOCK_CREATED_ID = 'new-service-id-456';

// 依存関係のモック
const mockServicesOrchestrator = {
  create: jest.fn(),
};

const mockAuthGuard: CanActivate = {
  canActivate: jest.fn(() => true),
};

const mockRequest = (userId: string | undefined): Partial<Request> => ({
  user: { userId: userId ?? '', username: 'test' },
});

describe('ServicesController (Controller) Test', () => {
  let controller: ServicesController;
  let servicesOrchestrator: typeof mockServicesOrchestrator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: ServicesOrchestrator,
          useValue: mockServicesOrchestrator,
        },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useValue(mockAuthGuard)
      .compile();

    controller = module.get<ServicesController>(ServicesController);
    servicesOrchestrator = module.get(ServicesOrchestrator);

    jest.clearAllMocks();
  });

  it('コントローラークラスが定義されていること', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    describe('正常系 (POST /services)', () => {
      it('サービス登録に成功してIDが返ること', async () => {
        servicesOrchestrator.create.mockResolvedValue(MOCK_CREATED_ID);
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        const result = await controller.create(MOCK_CREATE_REQUEST, req);

        expect(servicesOrchestrator.create).toHaveBeenCalledWith(
          MOCK_CREATE_REQUEST,
          MOCK_AUTH_USER_ID,
        );
        expect(result).toBe(MOCK_CREATED_ID);
      });
    });

    describe('異常系', () => {
      it('サービス名被りが発生した場合', async () => {
        const errorMessage = 'このサービスは登録できません';
        servicesOrchestrator.create.mockRejectedValue(
          new ConflictException(errorMessage),
        );
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        try {
          await controller.create(MOCK_CREATE_REQUEST, req);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(servicesOrchestrator.create).toHaveBeenCalledTimes(1);
          expect(error).toBeInstanceOf(ConflictException);
          expect((error as ConflictException).message).toBe(errorMessage);
        }
      });

      it('DBエラー', async () => {
        const errorMessage = 'Orchestrator failed';
        servicesOrchestrator.create.mockRejectedValue(
          new InternalServerErrorException(errorMessage),
        );
        const req = mockRequest(MOCK_AUTH_USER_ID) as Request;

        try {
          await controller.create(MOCK_CREATE_REQUEST, req);
          fail('例外検出できなかったのでテスト失敗');
        } catch (error) {
          expect(servicesOrchestrator.create).toHaveBeenCalledTimes(1);
          expect(error).toBeInstanceOf(InternalServerErrorException);
          expect((error as InternalServerErrorException).message).toBe(
            errorMessage,
          );
        }
      });
    });
  });
});
