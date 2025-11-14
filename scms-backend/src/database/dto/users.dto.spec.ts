/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { validate } from 'class-validator';
import { CreateUsersDto } from 'src/database/dto/users.dto';

const VALID_UUID = '12345678-1234-5678-1234-567812345678';

describe('UsersDtoのテスト', () => {
  describe('CreateUsersDtoのテスト', () => {
    const requiredData = {
      name: '登録ユーザー',
      email: 'create@example.com',
      password: 'password_create',
      registeredBy: VALID_UUID,
    };
    const optionalData = {
      id: VALID_UUID,
      token: 'long_token_content'.repeat(100), // 2048以下
      registeredAt: new Date(),
      updatedAt: new Date(),
      updatedBy: VALID_UUID,
      isDeleted: false,
    };
    const validData: CreateUsersDto = { ...requiredData, ...optionalData };

    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, requiredData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('全項目に入力がある場合', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, validData);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });

    describe('異常系', () => {
      test('必須項目が未入力の場合', async () => {
        const dto = new CreateUsersDto();
        dto.name = undefined as any;
        dto.email = undefined as any;
        dto.password = undefined as any;
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
            (e) => e.property === 'email' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'password' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
        expect(
          errors.some(
            (e) => e.property === 'registeredBy' && e.constraints?.isNotEmpty,
          ),
        ).toBe(true);
      });
      test('型・桁数違反の入力がある場合', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, validData);
        dto.email = 123 as any; // 型違反
        dto.name = 'a'.repeat(257); // 最大桁数違反
        dto.registeredBy = 'short-uuid'; // 桁数違反

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        // 型違反
        expect(
          errors.some((e) => e.property === 'email' && e.constraints?.isString),
        ).toBe(true);
        // 最大桁数違反
        expect(
          errors.some((e) => e.property === 'name' && e.constraints?.maxLength),
        ).toBe(true);
        // 桁数違反
        expect(
          errors.some(
            (e) => e.property === 'registeredBy' && e.constraints?.length,
          ),
        ).toBe(true);
      });
      test('メールアドレスの形式違反の入力がある場合', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, requiredData);
        dto.email = 'invalid-email';

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some((e) => e.property === 'email' && e.constraints?.isEmail),
        ).toBe(true);
      });
    });
  });
});
