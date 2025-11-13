import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersCreateRequestDto } from './dto/users-create-request.dto';
import { UsersOrchestrator } from './users.orchestrator';

/**
 * Users系APIのControllerクラス
 */
@Controller('users')
export class UsersController {
  constructor(private readonly usersOrchestrator: UsersOrchestrator) {}

  /**
   * ユーザー登録
   * @param body Request Body (UsersCreateRequestDto)
   * @returns 作成したユーザーのID
   */
  @Post('/')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: UsersCreateRequestDto): Promise<string> {
    // 処理委譲 (POST/create -> Orchestrator)
    return this.usersOrchestrator.create(body);
  }
}
