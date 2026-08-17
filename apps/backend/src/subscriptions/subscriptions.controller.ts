import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Controller()
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly config: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('users/me/subscription')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getForUser(user.id);
  }

  /** Called by RevenueCat's webhook — authenticated via a shared bearer secret. */
  @Post('webhooks/revenuecat')
  async handleWebhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { event: Record<string, unknown> },
  ) {
    const expectedSecret = this.config.get<string>('REVENUECAT_WEBHOOK_SECRET');
    if (expectedSecret && authorization !== `Bearer ${expectedSecret}`) {
      throw new ForbiddenException('Invalid webhook secret.');
    }
    await this.subscriptionsService.handleRevenueCatEvent(body.event as never);
    return { received: true };
  }
}
