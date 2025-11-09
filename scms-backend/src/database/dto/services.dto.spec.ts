/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import {
  SelectServicesDto,
  CreateServicesDto,
} from 'src/database/dto/services.dto';

const VALID_UUID = '12345678-1234-5678-1234-567812345678';

describe('ServicesDtoのテスト', () => {
  describe('SelectServicesDtoのテスト', () => {
    const validData: SelectServicesDto = {
      id: VALID_UUID,
      name: 'テストサービス',
      description: 'サービス概要',
      price: 1000,
      unit: '回',
      offset: 0,
      limit: 10,
      sortBy: 'price',
      sortOrder: 'asc',
    };

    describe('正常系', () => {
      test('全項目に入力がある場合', async () => {
        const dto = new SelectServicesDto();
        Object.assign(dto, validData);
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
        dto.id = 123 as any; // 文字列型違反
        dto.price = 'invalid' as any; // 数値型違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some((e) => e.property === 'id' && e.constraints?.isString),
        ).toBe(true);
        expect(
          errors.some((e) => e.property === 'price' && e.constraints?.isInt),
        ).toBe(true);
      });
    });
  });

  describe('CreateServicesDtoのテスト', () => {
    const requiredData = {
      name: '登録サービス',
      description: '登録概要',
      price: 5000,
      unit: '件',
      registeredBy: VALID_UUID,
    };
    const optionalData = {
      id: VALID_UUID,
      registeredAt: new Date(),
      updatedAt: new Date(),
      updatedBy: VALID_UUID,
      isDeleted: false,
    };
    const validData: CreateServicesDto = { ...requiredData, ...optionalData };

    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, requiredData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('全項目に入力がある場合', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('異常系', () => {
      test('必須項目が未入力の場合', async () => {
        const dto = new CreateServicesDto();
        dto.name = undefined as any;
        dto.description = undefined as any;
        dto.price = undefined as any;
        dto.unit = undefined as any;
        dto.registeredBy = undefined as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'name' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'description' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'price' && e.constraints?.isDefined,
          ),
        ).toBe(true); // priceは数値型のため isDefined
        expect(
          errors.some(
            (e) => e.property === 'unit' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'registeredBy' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
      });
      test('型・桁数違反の入力がある場合', async () => {
        const dto = new CreateServicesDto();
        Object.assign(dto, validData);
        dto.price = 'invalid' as any; // 型違反
        dto.name = 'a'.repeat(257); // 最大桁数違反
        dto.unit = 'a'.repeat(17); // 最大桁数違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        // 型違反
        expect(
          errors.some((e) => e.property === 'price' && e.constraints?.isInt),
        ).toBe(true);
        // 最大桁数違反
        expect(
          errors.some((e) => e.property === 'name' && e.constraints?.maxLength),
        ).toBe(true);
        expect(
          errors.some((e) => e.property === 'unit' && e.constraints?.maxLength),
        ).toBe(true);
      });
    });
  });
});
