import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { BulkActionDto } from './dto/bulk-action.dto';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── Create ─────────────────────────────────────────────────────────────

  @Post('users')
  @Roles('admin')
  async createUserWithProfile(@Body() dto: CreateUserWithProfileDto) {
    return this.adminService.createUserWithProfile(dto);
  }

  // ── List ──────────────────────────────────────────────────────────────

  @Get('users')
  @Roles('admin')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllUsers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search || undefined,
      role: role || undefined,
      status: status || undefined,
    });
  }

  // ── Insurers dropdown ─────────────────────────────────────────────────

  @Get('insurers')
  @Roles('admin')
  async getInsurersForDropdown() {
    return this.adminService.getInsurersForDropdown();
  }

  // ── Bulk operations (must be above :id routes) ────────────────────────

  @Patch('users/bulk/deactivate')
  @Roles('admin')
  async bulkDeactivate(@Body() dto: BulkActionDto) {
    return this.adminService.bulkDeactivate(dto.userIds);
  }

  @Delete('users/bulk/delete')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async bulkDelete(@Body() dto: BulkActionDto) {
    return this.adminService.bulkDelete(dto.userIds);
  }

  // ── Single user operations ────────────────────────────────────────────

  @Get('users/:id')
  @Roles('admin')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  @Roles('admin')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, dto);
  }

  @Patch('users/:id/toggle-active')
  @Roles('admin')
  async toggleUserActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.toggleUserActive(id);
  }

  @Patch('users/:id/reset-password')
  @Roles('admin')
  async resetPassword(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.adminService.resetPassword(id, dto);
  }

  @Delete('users/:id')
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: CurrentUserDto,
  ) {
    return this.adminService.deleteUser(id, user.id);
  }

  // ── Broadcast notifications ───────────────────────────────────────────

  @Post('broadcast')
  @Roles('admin')
  async broadcastNotification(@Body() dto: BroadcastNotificationDto) {
    return this.adminService.broadcastNotification(dto);
  }

  // ── Fraud detection ───────────────────────────────────────────────────

  @Get('fraud')
  @Roles('admin')
  async getFraudAnalysis() {
    return this.adminService.getFraudAnalysis();
  }
}
