import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ListRequestBase, ListResponseBase } from './common-paging.dto';
describe('ListRequestBase Validation Test', () => {
  const validateRequest = async (obj: object): Promise<ValidationError[]> => {
    const instance = plainToInstance(ListRequestBase, obj);
    return validate(instance);
  };

  test('正常系: すべての項目に正しい入力がある場合', async () => {
    const validData = {
      offset: 10,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    const errors = await validateRequest(validData);
    expect(errors.length).toBe(0);
  });

  test('正常系: 必須項目なし (空のオブジェクト) が許容される', async () => {
    const errors = await validateRequest({});
    expect(errors.length).toBe(0);
  });

  test('正常系: sortByのみがあり、sortOrderが未定義であることが許容される', async () => {
    const data = {
      sortBy: 'date',
    };
    const instance = plainToInstance(ListRequestBase, data);
    expect(instance.sortOrder).toBeUndefined();
    const errors = await validate(instance);
    expect(errors.length).toBe(0);
  });

  test('正常系: offsetとlimitのペアが正しく設定されている場合', async () => {
    const errors = await validateRequest({ offset: 0, limit: 1 });
    expect(errors.length).toBe(0);
  });

  test('異常系: limitはあるがoffsetが型間違いの場合', async () => {
    const errors = await validateRequest({
      offset: 'invalid_number',
      limit: 10,
    });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('offset');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });
  test('異常系: offsetはあるがlimitが型間違いの場合', async () => {
    const errors = await validateRequest({
      offset: 10,
      limit: 'invalid_number',
    });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  test('異常系: limitはあるがoffsetが未定義の場合', async () => {
    const errors = await validateRequest({
      limit: 10,
    });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('offset');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  test('異常系: offsetはあるがlimitが未定義の場合', async () => {
    const errors = await validateRequest({
      offset: 1,
    });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('isInt');
  });

  test('異常系: sortByはあるがsortOrderが不正な値の場合', async () => {
    const errors = await validateRequest({
      sortBy: 'name',
      sortOrder: 'invalid_order',
    });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('sortOrder');
    expect(errors[0].constraints).toHaveProperty('isIn');
  });

  test('異常系: limitが最小値(1)未満の場合', async () => {
    const errors = await validateRequest({ offset: 0, limit: 0 });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('limit');
    expect(errors[0].constraints).toHaveProperty('min');
  });

  test('異常系: sortOrderはあるがsortByがない場合 (sortByが必須)', async () => {
    const errors = await validateRequest({ sortOrder: 'asc' });
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('sortBy');
    expect(errors[0].constraints).toHaveProperty('isNotEmpty');
  });
});

describe('ListResponseBase Validation Test', () => {
  const validateResponse = async (obj: object): Promise<ValidationError[]> => {
    const instance = plainToInstance(ListResponseBase, obj);
    return validate(instance);
  };

  test('正常系: すべての項目に正しい入力がある場合', async () => {
    const validData = {
      totalCount: 100,
      currentPage: 2,
      offset: 10,
      limit: 50,
      data: [{ id: 1 }, { id: 2 }],
    };
    const errors = await validateResponse(validData);
    expect(errors.length).toBe(0);
  });

  test('正常系: 必須項目のみに正しい入力がある場合', async () => {
    const validData = {
      totalCount: 100,
      currentPage: 1,
      offset: 0,
      limit: 1,
    };
    const errors = await validateResponse(validData);
    expect(errors.length).toBe(0);
  });

  test('異常系: 必須項目(totalCount)が欠落している場合', async () => {
    const invalidData = {
      currentPage: 2,
      offset: 10,
      limit: 50,
    };
    const errors = await validateResponse(invalidData);
    expect(
      errors.some(
        (e) => e.property === 'totalCount' && e.constraints?.isNotEmpty,
      ),
    ).toBe(true);
  });

  test('異常系: 型間違いの入力がある場合 (totalCountが文字列)', async () => {
    const invalidData = {
      totalCount: '100', // 文字列
      currentPage: 2,
      offset: 10,
      limit: 50,
    };
    const errors = await validateResponse(invalidData);
    expect(
      errors.some((e) => e.property === 'totalCount' && e.constraints?.isInt),
    ).toBe(true);
  });

  test('異常系: limitが最小値(1)未満の場合', async () => {
    const invalidData = {
      totalCount: 100,
      currentPage: 1,
      offset: 0,
      limit: 0, // 最小値違反
    };
    const errors = await validateResponse(invalidData);
    expect(
      errors.some((e) => e.property === 'limit' && e.constraints?.min),
    ).toBe(true);
  });

  test('異常系: currentPageが最小値(1)未満の場合', async () => {
    const invalidData = {
      totalCount: 100,
      currentPage: 0, // 最小値違反
      offset: 10,
      limit: 50,
    };
    const errors = await validateResponse(invalidData);
    expect(
      errors.some((e) => e.property === 'currentPage' && e.constraints?.min),
    ).toBe(true);
  });
});
