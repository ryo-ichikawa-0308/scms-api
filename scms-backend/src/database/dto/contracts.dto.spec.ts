/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import {
  SelectContractsDto,
  CreateContractsDto,
} from 'src/database/dto/contracts.dto';

const VALID_UUID = '12345678-1234-5678-1234-567812345678';

describe('ContractsDtoのテスト', () => {
  describe('SelectContractsDtoのテスト', () => {
    const validData: SelectContractsDto = {
      id: VALID_UUID,
      usersId: VALID_UUID,
      userServicesId: VALID_UUID,
      quantity: 3,
      offset: 0,
      limit: 10,
      sortBy: 'quantity',
      sortOrder: 'asc',
    };

    describe('正常系', () => {
      test('全項目に入力がある場合', async () => {
        const dto = new SelectContractsDto();
        Object.assign(dto, validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('任意項目のみに入力がある場合 (空のDTO)', async () => {
        const dto = new SelectContractsDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('異常系', () => {
      test('型違反の入力がある場合', async () => {
        const dto = new SelectContractsDto();
        dto.usersId = 123 as any; // 文字列型違反
        dto.quantity = 'invalid' as any; // 数値型違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'usersId' && e.constraints?.isString,
          ),
        ).toBe(true);
        expect(
          errors.some((e) => e.property === 'quantity' && e.constraints?.isInt),
        ).toBe(true);
      });
    });
  });

  describe('CreateContractsDtoのテスト', () => {
    const requiredData = {
      usersId: VALID_UUID,
      userServicesId: VALID_UUID,
      quantity: 5,
      registeredBy: VALID_UUID,
    };
    const optionalData = {
      id: VALID_UUID,
      registeredAt: new Date(),
      updatedAt: new Date(),
      updatedBy: VALID_UUID,
      isDeleted: false,
    };
    const validData: CreateContractsDto = { ...requiredData, ...optionalData };

    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateContractsDto();
        Object.assign(dto, requiredData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('全項目に入力がある場合', async () => {
        const dto = new CreateContractsDto();
        Object.assign(dto, validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('異常系', () => {
      test('必須項目が未入力の場合', async () => {
        const dto = new CreateContractsDto();
        dto.usersId = undefined as any;
        dto.userServicesId = undefined as any;
        dto.quantity = undefined as any;
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
            (e) => e.property === 'userServicesId' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'quantity' && e.constraints?.isDefined,
          ),
        ).toBe(true); // quantityは数値型のため isDefined
        expect(
          errors.some(
            (e) => e.property === 'registeredBy' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
      });
      test('型・桁数違反の入力がある場合', async () => {
        const dto = new CreateContractsDto();
        Object.assign(dto, validData);
        dto.quantity = 'invalid' as any; // 型違反
        dto.userServicesId = 'short-uuid'; // 桁数違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        // 型違反
        expect(
          errors.some((e) => e.property === 'quantity' && e.constraints?.isInt),
        ).toBe(true);
        // 桁数違反
        expect(
          errors.some(
            (e) => e.property === 'userServicesId' && e.constraints?.maxLength,
          ),
        ).toBe(true); // IsUUIDも maxLengthとほぼ同等のチェックを行う
      });
    });
  });
});
