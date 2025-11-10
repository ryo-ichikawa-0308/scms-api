import { Injectable } from '@nestjs/common';
// import { UserServicesDao } from 'src/database/user_services.dao'; // Assumed DAO

import { UserServicesListRequestDto } from '../../domain/user-services/dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from '../../domain/user-services/dto/user-services-list-response.dto';
import { UserServicesDetailQueryDto } from '../../domain/user-services/dto/user-services-detail-query.dto';
import { UserServicesDetailResponseDto } from '../../domain/user-services/dto/user-services-detail-response.dto';
// import { SelectUserServicesDto } from 'src/database/user_services.dto'; // Assumed DB DTO

/**
 * ユーザーサービスに関するビジネスロジックを実装したServiceクラス
 */
@Injectable()
export class UserServicesService {
  // constructor(
  //   private readonly userServicesDao: UserServicesDao, // ユーザーサービスDAOに依存
  // ) {}

  // サービス一覧 (POST/list)
  /**
   * サービス一覧
   * @param body UserServicesListRequestDto
   * @param userId 認証情報から取得したユーザーID
   * @returns UserServicesListResponseDto
   */
  async list(
    body: UserServicesListRequestDto,
    userId: string,
  ): Promise<UserServicesListResponseDto> {
    // 1. TODO: RequestDtoからDB検索条件 (DAO) へ詰め替え
    // const selectDto: SelectUserServicesDto = { userId: userId, serviceName: body.serviceName, limit: body.limit, offset: body.offset, };

    // 2. TODO: DatabaseModule (DAO) を呼び出し、計数とDB検索を実行 (this.userServicesDao.countUserServices/selectUserServices)
    const totalCount = 0; // Mock
    const userServices = []; // Mock

    // 3. TODO: 検索結果をResponseDtoへ詰め替え (TableDto -> ResponseDto)
    const responseDto = new UserServicesListResponseDto(
      totalCount,
      Math.floor(body.offset / body.limit) + 1, // currentPage
      body.offset,
      body.limit,
    );
    responseDto.totalCount = totalCount;
    responseDto.totalPages = Math.ceil(totalCount / body.limit);
    responseDto.userServices = userServices.map((item) => ({
      /* TODO: 詰め替え */
    }));

    // 4. TODO: ResponseDtoを返却
    return responseDto;
  }

  // サービス詳細 (GET/detail)
  /**
   * サービス詳細
   * @param query UserServicesDetailQueryDto
   * @param userId 認証情報から取得したユーザーID
   * @returns UserServicesDetailResponseDto
   */
  async detail(
    query: UserServicesDetailQueryDto,
    userId: string,
  ): Promise<UserServicesDetailResponseDto> {
    // 1. TODO: QueryDtoからDB検索条件 (DAO) へ詰め替え
    // 2. TODO: DatabaseModule (DAO) を呼び出し、DB検索を実行 (this.userServicesDao.selectUserServices)
    // if (!userService) throw new NotFoundException();

    // 3. TODO: 検索結果をResponseDtoへ詰め替え (TableDto -> ResponseDto)
    return {
      id: query.id,
      usersId: userId,
      // ... 他のフィールド
    } as UserServicesDetailResponseDto; // Mock
  }
}
