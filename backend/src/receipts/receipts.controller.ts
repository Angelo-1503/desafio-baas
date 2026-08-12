import { Controller, Get, Header, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReceiptsService } from './receipts.service';

@ApiTags('Comprovantes')
@Controller('public/receipts')
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Get(':orderId')
  @ApiOperation({ summary: 'Dados do comprovante para renderizar a página imprimível' })
  getData(@Param('orderId') orderId: string) {
    return this.receiptsService.getReceiptData(orderId);
  }

  @Get(':orderId/pdf')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'Comprovante de pagamento em PDF' })
  async getPdf(@Param('orderId') orderId: string, @Res() res: Response) {
    const pdf = await this.receiptsService.generatePdf(orderId);
    res.setHeader('Content-Disposition', `inline; filename="comprovante-${orderId}.pdf"`);
    res.send(pdf);
  }
}
