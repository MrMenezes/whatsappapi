import { Controller, Get, Post, Headers, Body, Param } from '@nestjs/common';
import { AppService } from './app.service';
import { ISession, SessionService } from './session/session.service';
import { UserService } from './user/user.service';
import { WhatsAppService } from './whatsapp/whatsapp.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly userService: UserService,
    private readonly whasappService: WhatsAppService,
    private readonly sessionService: SessionService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('message')
  async message(
    @Body('number') number: string,
    @Body('text') text: string,
    @Body('userId') userId: string,
  ) {
    const user = await this.userService.getById(userId);
    const session = this.sessionService.getSession(user.id);
    this.whasappService.sendMessage(number, text, session);
  }
}
