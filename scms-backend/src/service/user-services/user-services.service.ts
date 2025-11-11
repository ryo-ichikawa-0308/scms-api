import { Injectable, NotFoundException } from '@nestjs/common';
import { UserServicesDao } from 'src/database/dao/user_services.dao';
import { UserServicesListRequestDto } from '../../domain/user-services/dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from '../../domain/user-services/dto/user-services-list-response.dto';
import { UserServicesDetailResponseDto } from '../../domain/user-services/dto/user-services-detail-response.dto';
import {
  SelectUserServicesDto,
  UserServicesDetailDto,
} from 'src/database/dto/user_services.dto';
import { UserServicesResponseServiceItemDto } from 'src/domain/user-services/dto/user-services-response-service-item.dto';
import { CommonService } from '../common/common.service';

/**
 * ユーザーサービスに関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class UserServicesService {
  constructor(
    private readonly userServicesDao: UserServicesDao,
    private readonly commonService: CommonService,
  ) {}

  // サービス一覧 (POST/list)
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
    return {
      ...paging,
      userServices: responseServices,
    } as UserServicesListResponseDto;
  }

  // サービス詳細 (GET/detail)
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
}
