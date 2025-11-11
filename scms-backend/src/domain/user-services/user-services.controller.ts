import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserServicesListRequestDto } from './dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from './dto/user-services-list-response.dto';
import { UserServicesDetailPathParamsDto } from './dto/user-services-detail-pathparams.dto';
import { UserServicesDetailQueryDto } from './dto/user-services-detail-query.dto';
import { UserServicesDetailResponseDto } from './dto/user-services-detail-response.dto';
import { UserServicesService } from '../../service/user-services/user-services.service';

/**
 * UserServices系APIのControllerクラス
 */
@Controller('user-services')
@UseGuards(AuthGuard('jwt'))
export class UserServicesController {
  constructor(private readonly userServicesService: UserServicesService) {}

  // サービス一覧 (POST/list) API
  /**
   * サービス一覧
   * @param body Request Body (UserServicesListRequestDto)
   * @param req Express Requestオブジェクト
   * @returns UserServicesListResponseDto
   */
  @Post('list')
  @HttpCode(HttpStatus.OK)
  async list(
    @Body() body: UserServicesListRequestDto,
  ): Promise<UserServicesListResponseDto> {
    // 処理委譲 (POST/list -> Service)
    return this.userServicesService.list(body);
  }

  // サービス詳細 (GET/detail) API
  /**
   * サービス詳細
   * @param pathParams Pathパラメータ (UserServicesDetailPathParamsDto)
   * @returns UserServicesDetailResponseDto
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async detail(
    @Param() pathParams: UserServicesDetailPathParamsDto,
  ): Promise<UserServicesDetailResponseDto> {
    // 1. Path/Queryパラメータの統合
    const query: UserServicesDetailQueryDto = { ...pathParams };

    // 2. 処理委譲 (GETメソッドはServiceに委譲)
    return this.userServicesService.detail(query);
  }
}
