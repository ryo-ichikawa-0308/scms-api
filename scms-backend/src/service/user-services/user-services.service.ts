import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { UserServicesListRequestDto } from '../../domain/user-services/dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from '../../domain/user-services/dto/user-services-list-response.dto';
import { UserServicesDetailResponseDto } from '../../domain/user-services/dto/user-services-detail-response.dto';
import {
  CreateUserServicesDto,
  SelectUserServicesDto,
  UserServicesDetailDto,
} from 'src/database/dto/user_services.dto';
import { UserServicesResponseServiceItemDto } from 'src/domain/user-services/dto/user-services-response-service-item.dto';
import { CommonService } from '../common/common.service';
import { PrismaTransaction } from 'src/prisma/prisma.type';
import { UserServicesCreateRequestDto } from 'src/domain/user-services/dto/user-services-create-request.dto';

/**
 * ユーザー提供サービスに関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class UserServicesService {
  constructor(
    private readonly userServicesDao: UserServicesDao,
    private readonly commonService: CommonService,
  ) {}

  /**
   * サービス一覧
   * @param body UserServicesListRequestDto
   * @returns UserServicesListResponseDto
   */
  async list(
    body: UserServicesListRequestDto,
  ): Promise<UserServicesListResponseDto> {
    // 1. RequestDtoからDB検索条件 (DAO) へ詰め替え
    const selectDto: SelectUserServicesDto = {
      servicesName: body.serviceName,
      limit: body.limit,
      offset: body.offset,
    };

    // 2. DatabaseModule (DAO) を呼び出し、計数とDB検索を実行
    const services = (await this.userServicesDao.selectUserServices(
      selectDto,
    )) as UserServicesDetailDto[];
    const totalCount = await this.userServicesDao.countUserServices(selectDto);

    // 3. 検索結果をResponseDtoへ詰め替え (TableDto -> ResponseDto)
    const responseServices: UserServicesResponseServiceItemDto[] = services.map(
      (item) => {
        return {
          id: item.id,
          usersId: item.usersId,
          servicesId: item.servicesId,
          name: item.services.name,
          description: item.services.description,
          price: item.services.price,
          unit: item.services.unit,
        };
      },
    );

    // ページング計算
    const paging = this.commonService.calcResponsePaging(
      totalCount,
      body.offset,
      body.limit,
    );

    // 4. ResponseDtoを返却
    return new UserServicesListResponseDto({
      ...paging,
      userServices: responseServices,
    });
  }

  /**
   * サービス詳細
   * @param id サービスID
   * @returns UserServicesDetailResponseDto
   */
  async detail(id: string): Promise<UserServicesDetailResponseDto> {
    // 1. DatabaseModule (DAO) を呼び出し、DB検索を実行
    const userService = await this.userServicesDao.selectUserServicesById(id);
    if (!userService) {
      throw new NotFoundException('ユーザー提供サービスが見つかりません');
    }

    // 2. 検索結果をResponseDtoへ詰め替え (TableDto -> ResponseDto)
    return {
      id: userService.id,
      usersId: userService.usersId,
      servicesId: userService.servicesId,
      name: userService.services.name,
      description: userService.services.description,
      price: userService.services.price,
      unit: userService.services.unit,
    } as UserServicesDetailResponseDto;
  }

  /**
   * ユーザー提供サービス登録
   * @param prismaTx トランザクション
   * @param userId トランザクション実行者のID
   * @param txDateTime トランザクション開始日時
   * @param query UserServicesCreateRequestDto
   * @returns 作成したユーザー提供サービスのID
   */
  async createWithTx(
    prismaTx: PrismaTransaction,
    userId: string,
    txDateTime: Date,
    body: UserServicesCreateRequestDto,
  ): Promise<string> {
    // 1. RequestDtoからDB登録データ (DAO) へ詰め替え
    const createUserServiceDto: CreateUserServicesDto = {
      usersId: body.userId,
      servicesId: body.serviceId,
      stock: body.stock,
      registeredBy: userId,
      registeredAt: txDateTime,
      isDeleted: false,
    };

    // 2. DAOのtx対応メソッドを呼び出し、DB登録を実行
    const createdUserService = await this.userServicesDao.createUserServices(
      prismaTx,
      createUserServiceDto,
    );

    if (!createdUserService) {
      throw new InternalServerErrorException(
        'ユーザー提供サービス登録に失敗しました',
      );
    }

    // 3. DB結果を返却
    return createdUserService.id;
  }
  /**
   * サービス被りを確認する
   * @param userId ユーザーID
   * @param serviceId サービスID
   * @returns 同一ユーザー提供サービスが存在したらtrue
   */
  async isUserServiceExists(
    userId: string,
    serviceId: string,
  ): Promise<boolean> {
    const userServicesExists =
      await this.userServicesDao.selectUserServicesByIds(userId, serviceId);
    return userServicesExists !== null;
  }
}
