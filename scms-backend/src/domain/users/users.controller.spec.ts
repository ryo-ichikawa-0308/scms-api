/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersOrchestrator } from './users.orchestrator';
import { UsersCreateRequestDto } from './dto/users-create-request.dto';

// 依存関係のモック

const mockRequestDto: UsersCreateRequestDto = {
  name: 'New User',
  email: 'newuser@test.com',
  password: 'test-password',
};

const mockUsersOrchestrator = {
  create: jest.fn(),
};

describe('UsersController (Controller) Test', () => {
  let controller: UsersController;
  let orchestrator: UsersOrchestrator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersOrchestrator,
          useValue: mockUsersOrchestrator,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    orchestrator = module.get<UsersOrchestrator>(UsersOrchestrator);
    jest.clearAllMocks();
  });

  it('コントローラークラスが定義されていること', () => {
    expect(controller).toBeDefined();
  });
  describe('create', () => {
    const CREATED_ID = '00000000-0000-0000-0000-000000000001';

    describe('正常系', () => {
      it('オーケストレーターのユーザー作成が実行されて、ユーザーIDが返ること', async () => {
        mockUsersOrchestrator.create.mockResolvedValue(CREATED_ID);
        const result: string = await controller.create(mockRequestDto);
        expect(orchestrator.create).toHaveBeenCalledWith(mockRequestDto);
        expect(result).toEqual(CREATED_ID);
      });
    });

    describe('異常系', () => {
      it('ユーザー登録に失敗すること', async () => {
        const mockError = new Error('Orchestrator error');
        mockUsersOrchestrator.create.mockRejectedValue(mockError);
        await expect(controller.create(mockRequestDto)).rejects.toThrow(
          mockError,
        );
      });
    });
  });
});
