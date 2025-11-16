/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { PrismaService } from './prisma.service';

// PrismaClientのモック設定
let constructorMock: jest.Mock;
const PrismaClientMock = {
  constructorMock: jest.fn(),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $on: jest.fn(),
};

jest.mock('@prisma/client', () => {
  class MockPrismaClient {
    constructor(...args: any[]) {
      constructorMock(...args);
      Object.assign(this, PrismaClientMock);
    }
  }
  return {
    PrismaClient: MockPrismaClient,
  };
});

// グローバルオブジェクトのモック
const processExitSpy = jest.spyOn(process, 'exit');

const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleError = jest
  .spyOn(console, 'error')
  .mockImplementation(() => {});

let sigIntCallback: (signal: string) => Promise<void>;
let sigTermCallback: (signal: string) => Promise<void>;

const processOnSpy = jest
  .spyOn(process, 'on')
  .mockImplementation((event, listener) => {
    if (event === 'SIGINT') {
      sigIntCallback = listener as (signal: string) => Promise<void>;
    } else if (event === 'SIGTERM') {
      sigTermCallback = listener as (signal: string) => Promise<void>;
    }
    return process as any;
  });

describe('PrismaService (Service) Test', () => {
  let service: PrismaService;
  beforeAll(() => {
    // テストスイート開始時にモック実装を一度設定
    processExitSpy.mockImplementation(() => {
      // プロセス終了のかわりに例外を出す
      throw new Error('process.exit was called');
    });
  });
  beforeEach(() => {
    jest.clearAllMocks();
    constructorMock = jest.fn();

    processExitSpy.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();
    processOnSpy.mockClear();

    PrismaClientMock.$connect.mockClear();
    PrismaClientMock.$disconnect.mockClear();

    service = new PrismaService();
  });

  afterAll(() => {
    processExitSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('constructor/init', () => {
    it('正常系: PrismaServiceが定義され、PrismaClientのインスタンス化とシャットダウンフックが設定されること', () => {
      expect(service).toBeDefined();

      expect(constructorMock).toHaveBeenCalledWith(
        expect.objectContaining({
          log: expect.arrayContaining([
            { level: 'query', emit: 'event' },
            { level: 'error', emit: 'stdout' },
            { level: 'warn', emit: 'stdout' },
          ]),
        }),
      );

      expect(process.on).toHaveBeenCalledWith('SIGINT', expect.any(Function));
      expect(process.on).toHaveBeenCalledWith('SIGTERM', expect.any(Function));
    });
  });

  describe('onModuleInit', () => {
    describe('正常系', () => {
      it('$connectが成功し、成功ログが出力されること', async () => {
        await service.onModuleInit();
        expect(service.$connect).toHaveBeenCalledTimes(1);
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'PrismaService initialized and connected to the database successfully.',
        );
        expect(processExitSpy).not.toHaveBeenCalled();
      });
    });

    describe('異常系', () => {
      it('$connectが失敗した場合、エラーログを出力し、process.exit(1)で終了すること', async () => {
        const mockError = new Error('DB Connection Failed');
        // @ts-expect-error: connectにエラーを返させるためエラー回避
        service.$connect.mockRejectedValue(mockError);

        await expect(service.onModuleInit()).rejects.toThrow(
          'process.exit was called',
        );

        expect(service.$connect).toHaveBeenCalledTimes(1);
        expect(mockConsoleError).toHaveBeenCalledWith(
          'Failed to connect to the database on initialization:',
          mockError,
        );
        expect(processExitSpy).toHaveBeenCalledWith(1);
      });
    });
  });

  describe('onModuleDestroy', () => {
    describe('正常系', () => {
      it('$disconnectが成功し、切断ログが出力されること', async () => {
        // @ts-expect-error: disconnectを成功させるためエラー回避
        service.$disconnect.mockResolvedValue(undefined);

        await service.onModuleDestroy();

        expect(service.$disconnect).toHaveBeenCalledTimes(1);
        expect(mockConsoleLog).toHaveBeenCalledWith(
          'PrismaService disconnected from the database.',
        );
      });
    });
    describe('異常系', () => {
      it('$disconnectが失敗した場合、エラーログを出力し、process.exit(1)で終了すること', async () => {
        const mockError = new Error('DB Disconnection Failed');
        // @ts-expect-error: disconnectにエラーを返させるためエラー回避
        service.$disconnect.mockRejectedValue(mockError);

        await expect(service.onModuleDestroy()).rejects.toThrow(
          'DB Disconnection Failed',
        );

        expect(service.$disconnect).toHaveBeenCalledTimes(1);
        expect(mockConsoleLog).not.toHaveBeenCalledWith(
          'PrismaService disconnected from the database.',
        );
      });
    });
  });
});
