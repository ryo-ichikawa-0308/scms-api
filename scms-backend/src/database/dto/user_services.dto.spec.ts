/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import {
  SelectUserServicesDto,
  CreateUserServicesDto,
} from 'src/database/dto/user_services.dto';

const VALID_UUID = '12345678-1234-5678-1234-567812345678';

describe('UserServicesDtoのテスト', () => {
  describe('SelectUserServicesDtoのテスト', () => {
    const validData: SelectUserServicesDto = {
      id: VALID_UUID,
      usersId: VALID_UUID,
      servicesId: VALID_UUID,
      stock: 5,
      offset: 0,
      limit: 10,
      sortBy: 'stock',
      sortOrder: 'desc',
    };

    describe('正常系', () => {
      test('全項目に入力がある場合', async () => {
        const dto = new SelectUserServicesDto();
        Object.assign(dto, validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('任意項目のみに入力がある場合 (空のDTO)', async () => {
        const dto = new SelectUserServicesDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('異常系', () => {
      test('型違反の入力がある場合', async () => {
        const dto = new SelectUserServicesDto();
        dto.usersId = 123 as any; // 文字列型違反
        dto.stock = 'invalid' as any; // 数値型違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'usersId' && e.constraints?.isString,
          ),
        ).toBe(true);
        expect(
          errors.some((e) => e.property === 'stock' && e.constraints?.isInt),
        ).toBe(true);
      });
    });
  });

  describe('CreateUserServicesDtoのテスト', () => {
    const requiredData = {
      usersId: VALID_UUID,
      servicesId: VALID_UUID,
      stock: 100,
      registeredBy: VALID_UUID,
    };
    const optionalData = {
      id: VALID_UUID,
      registeredAt: new Date(),
      updatedAt: new Date(),
      updatedBy: VALID_UUID,
      isDeleted: false,
    };
    const validData: CreateUserServicesDto = {
      ...requiredData,
      ...optionalData,
    };

    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateUserServicesDto();
        Object.assign(dto, requiredData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('全項目に入力がある場合', async () => {
        const dto = new CreateUserServicesDto();
        Object.assign(dto, validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('異常系', () => {
      test('必須項目が未入力の場合', async () => {
        const dto = new CreateUserServicesDto();
        dto.usersId = undefined as any;
        dto.servicesId = undefined as any;
        dto.stock = undefined as any;
        dto.registeredBy = undefined as any;

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'usersId' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'servicesId' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'stock' && e.constraints?.isDefined,
          ),
        ).toBe(true); // stockは数値型のため isDefined
        expect(
          errors.some(
            (e) => e.property === 'registeredBy' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
      });
      test('型・桁数違反の入力がある場合', async () => {
        const dto = new CreateUserServicesDto();
        Object.assign(dto, validData);
        dto.stock = 'invalid' as any; // 型違反
        dto.usersId = 'short-uuid'; // 桁数違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        // 型違反
        expect(
          errors.some((e) => e.property === 'stock' && e.constraints?.isInt),
        ).toBe(true);
        // 桁数違反
        expect(
          errors.some(
            (e) => e.property === 'usersId' && e.constraints?.maxLength,
          ),
        ).toBe(true); // IsUUIDも maxLengthとほぼ同等のチェックを行う
      });
    });
  });
});
