import {
  SelectServicesDto,
  CreateServicesDto,
} from 'src/database/dto/services.dto';
import { validate } from 'class-validator';

describe('ServicesDtoのテスト', () => {
  describe('SelectServicesDtoのテスト', () => {
    const validSelectDto: SelectServicesDto = {
      id: 'svc-1',
      name: 'Basic Service',
      price: 1000,
    };
    describe('正常系', () => {
      test('必須項目すべてに入力がある場合 (全て任意項目)', async () => {
        const dto = new SelectServicesDto();
        Object.assign(dto, validSelectDto);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('任意項目のみに入力がある場合 (空のDTO)', async () => {
        const dto = new SelectServicesDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('型違反の入力がある場合', async () => {
        const dto = new SelectServicesDto();
        Object.assign(dto, { price: 'abc' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some((e) => e.property === 'price' && e.constraints?.isInt),
        ).toBeTruthy();
      });
    });
  });
  describe('CreateServicesDtoのテスト', () => {
    const validCreateDto: CreateServicesDto = {
      name: 'Pro Service',
      description: 'A professional service',
      price: 5000,
      unit: 'month',
      registeredAt: new Date().toISOString(),
      registeredBy: 'admin',
      isDeleted: false,
    };
    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, validCreateDto);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('任意項目のみに入力がある場合 (optional fields)', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, { ...validCreateDto, id: 'uuid-123' });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('必須項目が未入力の場合 (name)', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, { ...validCreateDto, name: '' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'name' && e.constraints?.isNotEmpty,
          ),
        ).toBeTruthy();
      });
      test('最大桁数違反の入力がある場合 (unit)', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, { ...validCreateDto, unit: 'a'.repeat(17) });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some((e) => e.property === 'unit' && e.constraints?.maxLength),
        ).toBeTruthy();
      });
    });
  });
});
