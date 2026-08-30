import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BillingService } from './billing.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateCheckoutDto,
  ) {
    return this.billing.createCheckout(user.id, user.email, body.interval);
  }

  @Post('portal')
  portal(@CurrentUser() user: AuthenticatedUser) {
    return this.billing.createPortal(user.id);
  }

  @Public()
  @Post('webhook')
  webhook(@Req() request: Request & { rawBody?: Buffer }) {
    const raw = Buffer.isBuffer(request.body)
      ? request.body
      : (request.rawBody ??
        Buffer.from(
          typeof request.body === 'string'
            ? request.body
            : JSON.stringify(request.body ?? {}),
          'utf8',
        ));
    const signature = request.headers['stripe-signature'];
    return this.billing.handleWebhook(
      raw,
      typeof signature === 'string' ? signature : undefined,
    );
  }
}
