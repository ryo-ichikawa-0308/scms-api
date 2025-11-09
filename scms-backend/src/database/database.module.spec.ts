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
        .overrideModule(PrismaModule) // PrismaModuleはモックで代用
        .useModule({
          module: class MockPrismaModule {},
          providers: [],
          exports: [],
        })
        .compile();

      expect(module).toBeDefined();
      expect(module.get<UsersDao>(UsersDao)).toBeInstanceOf(UsersDao);
      expect(module.get<ServicesDao>(ServicesDao)).toBeInstanceOf(ServicesDao);
      expect(module.get<UserServicesDao>(UserServicesDao)).toBeInstanceOf(
        UserServicesDao,
      );
      expect(module.get<ContractsDao>(ContractsDao)).toBeInstanceOf(
        ContractsDao,
      );
    });
  });
});
