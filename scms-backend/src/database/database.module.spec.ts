import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersDao } from 'src/database/dao/users.dao';
import { ServicesDao } from 'src/database/dao/services.dao';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { ContractsDao } from 'src/database/dao/contracts.dao';

describe('DatabaseModuleのテスト', () => {
  let module: TestingModule;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [UsersDao, ServicesDao, UserServicesDao, ContractsDao],
      exports: [UsersDao, ServicesDao, UserServicesDao, ContractsDao],
    }).compile();
  });
  describe('正常系', () => {
    test('モジュールが正常にコンパイルできる場合', () => {
      expect(module).toBeDefined();
      expect(module.get<UsersDao>(UsersDao)).toBeDefined();
      expect(module.get<ServicesDao>(ServicesDao)).toBeDefined();
      expect(module.get<UserServicesDao>(UserServicesDao)).toBeDefined();
      expect(module.get<ContractsDao>(ContractsDao)).toBeDefined();
    });
  });
});
