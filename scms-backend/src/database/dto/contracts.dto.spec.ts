import {
  SelectContractsDto,
  CreateContractsDto,
} from 'src/database/dto/contracts.dto';
import { validate } from 'class-validator';

describe('ContractsDtoのテスト', () => {
  // 省略
  describe('SelectContractsDtoのテスト', () => {
    const validSelectDto: SelectContractsDto = {
      id: 'con-1',
      usersId: 'user-a',
      quantity: 5,
    };
    describe('正常系', () => {
      test('必須項目すべてに入力がある場合 (全て任意項目)', async () => {
        const dto = new SelectContractsDto();
        Object.assign(dto, validSelectDto);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('型違反の入力がある場合', async () => {
        const dto = new SelectContractsDto();
        Object.assign(dto, { quantity: 'abc' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some((e) => e.property === 'quantity' && e.constraints?.isInt),
        ).toBeTruthy();
      });
    });
  });
  describe('CreateContractsDtoのテスト', () => {
    const validCreateDto: CreateContractsDto = {
      usersId: 'user-a',
      userServicesId: 'usv-b',
      quantity: 10,
      registeredAt: new Date().toISOString(),
      registeredBy: 'client',
      isDeleted: false,
    };
    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateContractsDto();
        Object.assign(dto, validCreateDto);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('必須項目が未入力の場合 (quantity)', async () => {
        const dto = new CreateContractsDto();
        Object.assign(dto, { ...validCreateDto, quantity: undefined });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'quantity' && e.constraints?.isDefined,
          ),
        ).toBeTruthy();
      });
      test('型違反の入力がある場合 (userServicesId)', async () => {
        const dto = new CreateContractsDto();
        Object.assign(dto, { ...validCreateDto, userServicesId: 12345 });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'userServicesId' && e.constraints?.isString,
          ),
        ).toBeTruthy();
      });
    });
  });
});
