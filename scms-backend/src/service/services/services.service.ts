import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ServicesDao } from 'src/database/dao/services.dao';
import { CreateServicesDto } from 'src/database/dto/services.dto';
import { ServicesCreateRequestDto } from 'src/domain/services/dto/services-create-request.dto';
import { PrismaTransaction } from 'src/prisma/prisma.type';

/**
 * サービス(Services)のビジネスロジックを実装したサービスクラス
 */
@Injectable()
export class ServicesService {
  constructor(private readonly servicesDao: ServicesDao) {} //  // TODO: 依存するDAOに置き換える

  // 登録・更新系メソッドのテンプレート
  /**
   * サービス登録
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param body ServicesCreateRequestDto
   * @returns ServiceModel
   */
  async createWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: ServicesCreateRequestDto,
  ): Promise<string> {
    // 1. RequestDtoからDB登録データ (DAO) へ詰め替え (RequestDto -> TableDto) schema.prismaの型情報、制約を利用する。
    const createServiceDto: CreateServicesDto = {
      name: body.name,
      description: body.description,
      price: body.price,
      unit: body.unit,
      registeredBy: userId,
      registeredAt: txDateTime,
      isDeleted: false,
    };

    // 2. DAOのtx対応メソッドを呼び出し、DB登録を実行 (prismaTxを渡す)
    const createdService = await this.servicesDao.createServices(
      prismaTx,
      createServiceDto,
    );

    if (!createdService) {
      throw new InternalServerErrorException('サービス登録に失敗しました');
    }

    // 3. DB結果を返却
    return createdService.id;
  }

  /**
   * サービス名被りを確認する
   * @param name サービス名
   * @returns 同名のサービスが存在したらtrue
   */
  async isServiceExists(name: string): Promise<boolean> {
    const servicesExists = await this.servicesDao.selectServicesByName(name);
    return servicesExists !== null;
  }
}
