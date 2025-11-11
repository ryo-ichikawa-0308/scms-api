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
import type { Request } from 'express';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthOrchestrator } from './auth.orchestrator';

/**
 * 認証系APIのControllerクラス
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authOrchestrator: AuthOrchestrator) {}

  // ログイン (POST/login) API
  /**
   * ログイン
   * @param body Request Body (AuthLoginRequestDto)
   * @returns AuthLoginResponseDto
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: AuthLoginRequestDto,
  ): Promise<AuthLoginResponseDto> {
    // 処理委譲 (POST/login -> Orchestrator)
    return this.authOrchestrator.login(body);
  }

  // ログアウト (POST/logout) API
  /**
   * ログアウト
   * @param req Express Requestオブジェクト
   * @returns void
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request): Promise<void> {
    // 認証情報からユーザーIDを取得
    const userId = req.user?.userId ?? '';
    // 処理委譲 (POST/logout -> Orchestrator)
    await this.authOrchestrator.logout(userId);
  }
}
