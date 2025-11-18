import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { UsersDao } from 'src/database/dao/users.dao';
import { UsersCreateRequestDto } from '../../domain/users/dto/users-create-request.dto';
import { CreateUsersDto } from 'src/database/dto/users.dto';
import { AuthService } from '../auth/auth.service';

/**
 * ユーザーに関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly usersDao: UsersDao,
    private readonly authService: AuthService,
  ) {}

  /**
   * ユーザー登録 (トランザクション内実行)
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body UsersCreateRequestDto
   * @returns 作成したユーザーのID
   */
  async createWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: UsersCreateRequestDto,
  ): Promise<string> {
    // 1. RequestDtoからDB登録データ (DAO) へ詰め替え (RequestDto -> CreateUsersDto)
    const hashedPassword = await this.authService.getPasswordHash(
      body.password,
    );
    const createDto: CreateUsersDto = {
      id: userId,
      name: body.name,
      email: body.email,
      password: hashedPassword,
      registeredBy: userId,
      registeredAt: txDateTime,
    };

    // 2. DAOのtx対応メソッドを呼び出し、DB登録を実行 (prismaTxを渡す)
    const createdUser = await this.usersDao.createUsers(prismaTx, createDto);
    if (!createdUser) {
      throw new InternalServerErrorException('ユーザー登録に失敗しました');
    }

    // 3. 登録成功。
    return createdUser.id;
  }

  /**
   * メールアドレスが登録済みか検査する
   * @param email 検査対象のメールアドレス
   */
  async isValidEmail(email: string): Promise<void> {
    const isUserExists = await this.usersDao.selectUsersByEmail(email);
    if (isUserExists) {
      throw new ConflictException('このユーザーは登録できません');
    }
  }
}
