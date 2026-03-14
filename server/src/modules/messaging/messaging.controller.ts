import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { MessageFilterDto } from './dto/message-filter.dto';

@Controller({ path: 'claims/:claimId/messages', version: '1' })
export class MessagingController {
  constructor(private readonly messagingService: MessagingService) {}

  /**
   * Send a message in a claim chat
   * POST /v1/claims/:claimId/messages
   */
  @Post()
  @Roles('hospital', 'insurer')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('claimId') claimId: string,
    @Body() data: SendMessageDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.messagingService.sendMessage(claimId, data, user);
  }

  /**
   * Get paginated messages for a claim (auto-marks as read)
   * GET /v1/claims/:claimId/messages
   */
  @Get()
  @Roles('hospital', 'insurer')
  async getMessages(
    @Param('claimId') claimId: string,
    @Query() filters: MessageFilterDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.messagingService.getMessages(
      claimId,
      filters.page ?? 1,
      filters.limit ?? 50,
      user,
    );
  }

  /**
   * Mark all unread messages as read
   * PATCH /v1/claims/:claimId/messages/read
   */
  @Patch('read')
  @Roles('hospital', 'insurer')
  async markAsRead(
    @Param('claimId') claimId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.messagingService.markAsRead(claimId, user);
  }

  /**
   * Get unread message count
   * GET /v1/claims/:claimId/messages/unread-count
   */
  @Get('unread-count')
  @Roles('hospital', 'insurer')
  async getUnreadCount(
    @Param('claimId') claimId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.messagingService.getUnreadCount(claimId, user);
  }

  /**
   * Edit a message (sender only)
   * PUT /v1/claims/:claimId/messages/:messageId
   */
  @Put(':messageId')
  @Roles('hospital', 'insurer')
  async updateMessage(
    @Param('claimId') claimId: string,
    @Param('messageId') messageId: string,
    @Body() data: UpdateMessageDto,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.messagingService.updateMessage(claimId, messageId, data, user);
  }

  /**
   * Delete a message (sender only)
   * DELETE /v1/claims/:claimId/messages/:messageId
   */
  @Delete(':messageId')
  @Roles('hospital', 'insurer')
  async deleteMessage(
    @Param('claimId') claimId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.messagingService.deleteMessage(claimId, messageId, user);
  }
}
