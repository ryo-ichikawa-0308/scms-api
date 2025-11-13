import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ServicesCreateRequestDto } from './dto/services-create-request.dto';
import type { Request } from 'express';
import { ServicesOrchestrator } from './services.orchestrator';

/**
 * サービス(Services)のControllerクラス
 */
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesOrchestrator: ServicesOrchestrator) {}
  /**
   * サービス登録
   * @param body Request Body
   * @param req Express Requestオブジェクト
   * @returns ServicesCreateResponseDto
   */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.CREATED) // response.status: 201
  async create(
    @Body() body: ServicesCreateRequestDto,
    @Req() req: Request,
  ): Promise<string> {
    // 1. 認証情報からユーザーIDを取得
    const userId = req.user?.userId ?? '';
    // 2. 処理委譲 (POSTメソッドはOrchestratorに委譲)
    return this.servicesOrchestrator.create(body, userId);
  }
}
