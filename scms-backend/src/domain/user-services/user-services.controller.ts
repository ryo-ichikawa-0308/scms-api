import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserServicesListRequestDto } from './dto/user-services-list-request.dto';
import { UserServicesListResponseDto } from './dto/user-services-list-response.dto';
import { UserServicesDetailPathParamsDto } from './dto/user-services-detail-pathparams.dto';
import { UserServicesDetailResponseDto } from './dto/user-services-detail-response.dto';
import { UserServicesService } from '../../service/user-services/user-services.service';
import { UserServicesCreateRequestDto } from './dto/user-services-create-request.dto';
import { UserServicesOrchestrator } from './user-services.orchestrator';
import type { Request } from 'express';

/**
 * UserServices系APIのControllerクラス
 */
@Controller('user-services')
@UseGuards(AuthGuard('jwt'))
export class UserServicesController {
  constructor(
    private readonly userServicesService: UserServicesService,
    private readonly userServicesOrchestrator: UserServicesOrchestrator,
  ) {}

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
    // 1. 処理委譲 (GETメソッドはServiceに委譲)
    return this.userServicesService.detail(pathParams.id);
  }

  /**
   * ユーザー提供サービス登録
   * @param body Request Body
   * @param req Express Requestオブジェクト
   * @returns UserServicesCreateResponseDto
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: UserServicesCreateRequestDto,
    @Req() req: Request,
  ): Promise<string> {
    // 1. 認証情報からユーザーIDを取得
    const userId = req.user?.userId ?? '';
    // 2. 処理委譲 (POSTメソッドはOrchestratorに委譲)
    return this.userServicesOrchestrator.create(body, userId);
  }
}
