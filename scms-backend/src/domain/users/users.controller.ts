import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersCreateRequestDto } from './dto/users-create-request.dto';
import { UsersCreateResponseDto } from './dto/users-create-response.dto';
import { UsersOrchestrator } from './users.orchestrator';

/**
 * Users系APIのControllerクラス
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersOrchestrator: UsersOrchestrator,
  ) {}

  // ユーザー登録 (POST/create) API
  /**
   * ユーザー登録
   * @param body Request Body (UsersCreateRequestDto)
   * @returns UsersCreateResponseDto (204 No Content)
   */
  @Post('/')
  @HttpCode(HttpStatus.NO_CONTENT) // 204
  async create(
    @Body() body: UsersCreateRequestDto,
  ): Promise<UsersCreateResponseDto> {
    // 処理委譲 (POST/create -> Orchestrator)
    return this.usersOrchestrator.create(body);
  }
}