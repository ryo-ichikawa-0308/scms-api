import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { ContractsListRequestDto } from './dto/contracts-list-request.dto';
import { ContractsListResponseDto } from './dto/contracts-list-response.dto';
import { ContractsDetailPathParamsDto } from './dto/contracts-detail-pathparams.dto';
import { ContractsDetailQueryDto } from './dto/contracts-detail-query.dto';
import { ContractsDetailResponseDto } from './dto/contracts-detail-response.dto';
import { ContractsCreateRequestDto } from './dto/contracts-create-request.dto';
import { ContractsCreateResponseDto } from './dto/contracts-create-response.dto';
import { ContractsCancelPathParamsDto } from './dto/contracts-cancel-pathparams.dto';
import { ContractsCancelQueryDto } from './dto/contracts-cancel-query.dto';
import { ContractsOrchestrator } from './contracts.orchestrator';
import { ContractsService } from '../../service/contracts/contracts.service';

/**
 * Contracts系APIのControllerクラス
 */
@Controller('contracts')
@UseGuards(AuthGuard('jwt')) // 全APIでauthRequired === true
export class ContractsController {
  constructor(
    private readonly contractsOrchestrator: ContractsOrchestrator,
    private readonly contractsService: ContractsService,
  ) {}

  // 契約一覧 (POST/list) API
  /**
   * 契約一覧
   * @param body Request Body (ContractsListRequestDto)
   * @param req Express Requestオブジェクト
   * @returns ContractsListResponseDto
   */
  @Post('list')
  @HttpCode(HttpStatus.OK)
  async list(
    @Body() body: ContractsListRequestDto,
    @Req() req: Request,
  ): Promise<ContractsListResponseDto> {
    const userId = req.user?.userId ?? '';
    // 処理委譲 (POST/list -> Service)
    return this.contractsService.list(body, userId);
  }

  // 契約詳細 (GET/detail) API
  /**
   * 契約詳細
   * @param pathParams Pathパラメータ (ContractsDetailPathParamsDto)
   * @returns ContractsDetailResponseDto
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async detail(
    @Param() pathParams: ContractsDetailPathParamsDto,
  ): Promise<ContractsDetailResponseDto> {
    // 1. Path/Queryパラメータの統合
    const query: ContractsDetailQueryDto = { ...pathParams };
    // 2. 処理委譲 (GETメソッドはServiceに委譲)
    return this.contractsService.detail(query);
  }

  // サービス契約 (POST/create) API
  /**
   * サービス契約
   * @param body Request Body (ContractsCreateRequestDto)
   * @param req Express Requestオブジェクト
   * @returns ContractsCreateResponseDto
   */
  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: ContractsCreateRequestDto,
    @Req() req: Request,
  ): Promise<ContractsCreateResponseDto> {
    const userId = req.user?.userId ?? '';
    // 処理委譲 (POST/create -> Orchestrator)
    const newId = await this.contractsOrchestrator.create(body, userId);
    return { id: newId };
  }

  // サービス解約 (PATCH/cancel) API
  /**
   * サービス解約
   * @param pathParams Pathパラメータ (ContractsCancelPathParamsDto)
   * @param body Request Body (ContractsCancelRequestDto)
   * @param req Express Requestオブジェクト
   * @returns ContractsCancelResponseDto
   */
  @Patch(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async cancel(
    @Param() pathParams: ContractsCancelPathParamsDto,
    @Req() req: Request,
  ): Promise<void> {
    const userId = req.user?.userId ?? '';
    // 1. クエリの結合
    const query: ContractsCancelQueryDto = { ...pathParams };
    // 2. 処理委譲 (PATCH/cancel -> Orchestrator)
    await this.contractsOrchestrator.cancel(query, userId);
  }
}
