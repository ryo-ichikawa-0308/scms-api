import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Res,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthLoginRequestDto } from './dto/auth-login-request.dto';
import { AuthLoginResponseDto } from './dto/auth-login-response.dto';
import { AuthOrchestrator } from './auth.orchestrator';
import { AuthRefreshResponseDto } from './dto/auth-refresh-response.dto';
import { ConfigService } from '@nestjs/config';

/**
 * 認証系APIのControllerクラス
 */
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(
    private readonly authOrchestrator: AuthOrchestrator,
    private readonly configService: ConfigService,
  ) {}

  /**
   * ログイン
   * @param body Request Body (AuthLoginRequestDto)
   * @returns AuthLoginResponseDto
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: AuthLoginRequestDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthLoginResponseDto> {
    // 1. 処理委譲 (POST/login -> Orchestrator)
    const loginDto = await this.authOrchestrator.login(body);

    // 2. リフレッシュトークンをCookieに保存
    const refreshTokenKey =
      this.configService.getOrThrow<string>('REFRESH_TOKEN_KEY');
    res.cookie(refreshTokenKey, loginDto.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(
        Date.now() + Number(loginDto.refreshTokenExpiresIn ?? 0),
      ),
    });

    // 3. トークン情報を返却
    return loginDto;
  }

  /**
   * ログアウト
   * @param req Express Requestオブジェクト
   * @returns void
   */
  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    // 認証情報からユーザーIDを取得
    const userId = req.user?.userId ?? '';
    // 処理委譲 (POST/logout -> Orchestrator)
    await this.authOrchestrator.logout(userId);
    // リフレッシュトークンを無効化する
    const refreshTokenKey =
      this.configService.getOrThrow<string>('REFRESH_TOKEN_KEY');
    res.cookie(refreshTokenKey, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(0),
    });
  }

  /**
   * トークンリフレッシュ
   * @returns AuthRefreshResponseDto
   */
  @Post('refresh')
  @UseGuards(AuthGuard('jwt-refresh'))
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthRefreshResponseDto> {
    // 1. 認証情報からユーザーIDとユーザー名を取得
    const userId = req.user?.userId ?? '';
    const userName = req.user?.username ?? '';

    // 2. 処理委譲 (POST/WriteメソッドはOrchestratorに委譲)
    const refreshDto = await this.authOrchestrator.refresh(userId, userName);

    // 3. リフレッシュトークンをCookieに保存
    const refreshTokenKey =
      this.configService.getOrThrow<string>('REFRESH_TOKEN_KEY');
    res.cookie(refreshTokenKey, refreshDto.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      expires: new Date(
        Date.now() + Number(refreshDto.refreshTokenExpiresIn ?? 0),
      ),
    });

    // 4. トークン情報を返却
    return refreshDto;
  }
}
