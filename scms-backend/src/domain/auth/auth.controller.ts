import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport'; // Assumed from instruction template
import type { Request } from 'express'; // Assumed from instruction template

import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthLogoutRequestDto } from './dto/auth-logout-request.dto';
import { AuthLogoutResponseDto } from './dto/auth-logout-response.dto';
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
   * @param body Request Body (AuthLogoutRequestDto)
   * @param req Express Requestオブジェクト
   * @returns AuthLogoutResponseDto
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT) // 204
  async logout(
    @Body() body: AuthLogoutRequestDto,
    @Req() req: Request, // Assumed to get userId from token
  ): Promise<AuthLogoutResponseDto> {
    const userId = (req.user as any)?.id ?? 'MOCK_USER_ID'; // TODO: 認証情報からユーザーIDを取得

    // 処理委譲 (POST/logout -> Orchestrator)
    return this.authOrchestrator.logout(body, userId);
  }
}
