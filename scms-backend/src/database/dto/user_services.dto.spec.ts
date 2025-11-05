import { SelectUserServicesDto, CreateUserServicesDto } from 'src/database/dto/user_services.dto';
import { validate } from 'class-validator';

describe('UserServicesDtoのテスト', () => {
    // 省略
    describe('SelectUserServicesDtoのテスト', () => {
        const validSelectDto: SelectUserServicesDto = {
            id: 'usv-1',
            usersId: 'user-a',
            stock: 10,
        };
        describe('正常系', () => {
            test('必須項目すべてに入力がある場合 (全て任意項目)', async () => {
                const dto = new SelectUserServicesDto();
                Object.assign(dto, validSelectDto);
                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });
        describe('異常系', () => {
            test('型違反の入力がある場合', async () => {
                const dto = new SelectUserServicesDto();
                Object.assign(dto, { usersId: 123, stock: 'abc' });
                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors.some(e => e.property === 'usersId' && e.constraints?.isString)).toBeTruthy();
            });
        });
    });
    describe('CreateUserServicesDtoのテスト', () => {
        const validCreateDto: CreateUserServicesDto = {
            usersId: 'user-a',
            servicesId: 'svc-b',
            stock: 5,
            registeredAt: new Date().toISOString(),
            registeredBy: 'admin',
            isDeleted: 0,
        };
        describe('正常系', () => {
            test('必須項目すべてに入力がある場合', async () => {
                const dto = new CreateUserServicesDto();
                Object.assign(dto, validCreateDto);
                const errors = await validate(dto);
                expect(errors.length).toBe(0);
            });
        });
        describe('異常系', () => {
            test('必須項目が未入力の場合 (usersId)', async () => {
                const dto = new CreateUserServicesDto();
                Object.assign(dto, { ...validCreateDto, usersId: '' });
                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors.some(e => e.property === 'usersId' && e.constraints?.isNotEmpty)).toBeTruthy();
            });
            test('型違反の入力がある場合 (stock)', async () => {
                const dto = new CreateUserServicesDto();
                Object.assign(dto, { ...validCreateDto, stock: 'not-a-number' });
                const errors = await validate(dto);
                expect(errors.length).toBeGreaterThan(0);
                expect(errors.some(e => e.property === 'stock' && e.constraints?.isInt)).toBeTruthy();
            });
        });
    });
});
