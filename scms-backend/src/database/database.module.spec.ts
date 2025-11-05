import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseModule } from 'src/database/database.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersDao } from 'src/database/dao/users.dao';
import { ServicesDao } from 'src/database/dao/services.dao';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { ContractsDao } from 'src/database/dao/contracts.dao';

describe('DatabaseModuleのテスト', () => {
  describe('正常系', () => {
    test('モジュールが正常にコンパイルできる場合', async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [DatabaseModule],
      })
        .overrideModule(PrismaModule)
        .useValue({ module: true })
        .compile();

      expect(module).toBeDefined();
      expect(module.get<UsersDao>(UsersDao)).toBeDefined();
      expect(module.get<ServicesDao>(ServicesDao)).toBeDefined();
      expect(module.get<UserServicesDao>(UserServicesDao)).toBeDefined();
      expect(module.get<ContractsDao>(ContractsDao)).toBeDefined();
    });
  });
});
