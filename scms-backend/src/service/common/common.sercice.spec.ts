import { Test, TestingModule } from '@nestjs/testing';
import { CommonService } from './common.service';

describe('CommonService', () => {
  let service: CommonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommonService],
    }).compile();

    service = module.get<CommonService>(CommonService);
  });

  it('サービスクラスが定義されていること', () => {
    expect(service).toBeDefined();
  });

  describe('calcResponsePaging', () => {
    describe('正常系', () => {
      it('ページングが正しく計算できること(総件数が割り切れるパターン)', () => {
        const totalCount = 100;
        const offset = 50;
        const limit = 10;

        const result = service.calcResponsePaging(totalCount, offset, limit);

        expect(result).toEqual({
          offset: 50,
          limit: 10,
          totalCount: 100,
          totalPages: 10,
          currentPage: 6,
        });
      });

      it('ページングが正しく計算できること(総件数が割り切れないパターン)', () => {
        const totalCount = 103;
        const offset = 50;
        const limit = 10;

        const result = service.calcResponsePaging(totalCount, offset, limit);

        expect(result).toEqual({
          offset: 50,
          limit: 10,
          totalCount: 103,
          totalPages: 11,
          currentPage: 6,
        });
      });

      it('最初のページ(offset=0)', () => {
        const totalCount = 50;
        const offset = 0;
        const limit = 25;

        const result = service.calcResponsePaging(totalCount, offset, limit);

        expect(result).toEqual({
          offset: 0,
          limit: 25,
          totalCount: 50,
          totalPages: 2,
          currentPage: 1,
        });
      });

      it('最後のページ', () => {
        const totalCount = 42;
        const offset = 40;
        const limit = 10;

        const result = service.calcResponsePaging(totalCount, offset, limit);

        expect(result).toEqual({
          offset: 40,
          limit: 10,
          totalCount: 42,
          totalPages: 5,
          currentPage: 5,
        });
      });

      it('要件上の最大値(99999)', () => {
        const totalCount = 99999;
        const offset = 99900;
        const limit = 100;

        const result = service.calcResponsePaging(totalCount, offset, limit);

        expect(result).toEqual({
          offset: 99900,
          limit: 100,
          totalCount: 99999,
          totalPages: 1000,
          currentPage: 1000,
        });
      });

      it('0件の場合', () => {
        const totalCount = 0;
        const offset = 0;
        const limit = 10;

        const result = service.calcResponsePaging(totalCount, offset, limit);

        expect(result).toEqual({
          offset: 0,
          limit: 10,
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
        });
      });

      it('offsetとlimitが渡されていない場合はoffset=0 limit=1とみなされる', () => {
        const totalCount = 75;

        const result = service.calcResponsePaging(totalCount);

        expect(result).toEqual({
          offset: undefined,
          limit: undefined,
          totalCount: 75,
          totalPages: 75,
          currentPage: 1,
        });
      });

      it('limitのみが渡されている場合はoffset=0とみなされる', () => {
        const totalCount = 20;
        const limit = 5;

        const result = service.calcResponsePaging(totalCount, undefined, limit);

        expect(result).toEqual({
          offset: undefined,
          limit: 5,
          totalCount: 20,
          totalPages: 4,
          currentPage: 1,
        });
      });
    });
  });
});
