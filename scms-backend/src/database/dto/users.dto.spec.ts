import { SelectUsersDto, CreateUsersDto } from 'src/database/dto/users.dto';
import { validate } from 'class-validator';

describe('UsersDtoのテスト', () => {
  describe('SelectUsersDtoのテスト', () => {
    const validSelectDto: SelectUsersDto = {
      id: '1',
      name: 'test-user',
      offset: 0,
      limit: 10,
    };
    describe('正常系', () => {
      test('必須項目すべてに入力がある場合 (全て任意項目)', async () => {
        const dto = new SelectUsersDto();
        Object.assign(dto, validSelectDto);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('任意項目のみに入力がある場合 (空のDTO)', async () => {
        const dto = new SelectUsersDto();
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('型違反の入力がある場合', async () => {
        const dto = new SelectUsersDto();
        Object.assign(dto, { id: 123, offset: 'abc' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
      });
    });
  });
  describe('CreateUsersDtoのテスト', () => {
    const validCreateDto: CreateUsersDto = {
      name: 'test-user',
      email: 'test@example.com',
      password: 'hashed-password',
      registeredAt: new Date().toISOString(),
      registeredBy: 'system',
      isDeleted: false,
    };
    describe('正常系', () => {
      test('必須項目すべてに入力がある場合', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, validCreateDto);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
      test('任意項目のみに入力がある場合 (optional fields)', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, {
          ...validCreateDto,
          id: 'uuid-123',
          updatedAt: new Date().toISOString(),
          updatedBy: 'user-id',
        });
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
      });
    });
    describe('異常系', () => {
      test('必須項目が未入力の場合 (name)', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, { ...validCreateDto, name: '' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some((e) => e.property === 'name' && e.constraints?.isDefined),
        ).toBeFalsy();
        expect(
          errors.some(
            (e) => e.property === 'name' && e.constraints?.isNotEmpty,
          ),
        ).toBeTruthy();
      });
      test('型違反の入力がある場合 (isDeleted)', async () => {
        const dto = new CreateUsersDto();
        Object.assign(dto, { ...validCreateDto, isDeleted: 'not-a-number' });
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(
          errors.some(
            (e) => e.property === 'isDeleted' && e.constraints?.isBoolean,
          ),
        ).toBeTruthy();
      });
    });
  });
});
