import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { QuotesService } from './quotes.service';
import { CreateQuoteRequestDto } from './dto/create-quote-request.dto';
import { RecordGarageResponseDto } from './dto/record-garage-response.dto';

@Controller()
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('quote-requests')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateQuoteRequestDto) {
    return this.quotesService.create(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('quote-requests/:id')
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.quotesService.getOwned(user.id, id);
  }

  /**
   * Called by the inbound email/voice-transcript parser (external service),
   * not by the mobile app — hence the shared-secret header instead of JWT.
   */
  @Post('webhooks/garage-response')
  recordResponse(
    @Headers('x-webhook-secret') providedSecret: string | undefined,
    @Body() dto: RecordGarageResponseDto,
  ) {
    const expectedSecret = this.config.get<string>('EMAIL_INBOUND_WEBHOOK_SECRET');
    if (expectedSecret && providedSecret !== expectedSecret) {
      throw new ForbiddenException('Invalid webhook secret.');
    }
    return this.quotesService.recordResponse(dto);
  }
}
