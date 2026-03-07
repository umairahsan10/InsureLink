import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * POST /admin/users
   * Create a new user with their role-specific profile.
   * Only accessible by admin users.
   */
  @Post('users')
  async createUserWithProfile(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateUserWithProfileDto,
  ) {
    return this.adminService.createUserWithProfile(user.id, dto);
  }

  /**
   * GET /admin/users
   * Get all users (for admin listing).
   */
  @Get('users')
  async getAllUsers(@CurrentUser() user: CurrentUserDto) {
    return this.adminService.getAllUsers(user.id);
  }

  /**
   * GET /admin/insurers
   * Get all active insurers for dropdown (when creating corporate).
   */
  @Get('insurers')
  async getInsurersForDropdown(@CurrentUser() user: CurrentUserDto) {
    return this.adminService.getInsurersForDropdown(user.id);
  }
}
