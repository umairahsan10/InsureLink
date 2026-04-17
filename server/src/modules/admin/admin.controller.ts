import { Controller, Post, Get, Body, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateUserWithProfileDto } from './dto/create-user-with-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * POST /admin/users
   * Create a new user with their role-specific profile.
   */
  @Post('users')
  @Roles('admin')
  async createUserWithProfile(
    @Body() dto: CreateUserWithProfileDto,
  ) {
    return this.adminService.createUserWithProfile(dto);
  }

  /**
   * GET /admin/users
   * Get all users with pagination, search, and role filter.
   */
  @Get('users')
  @Roles('admin')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    return this.adminService.getAllUsers({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      search: search || undefined,
      role: role || undefined,
    });
  }

  /**
   * GET /admin/insurers
   * Get all active insurers for dropdown (when creating corporate).
   */
  @Get('insurers')
  @Roles('admin')
  async getInsurersForDropdown() {
    return this.adminService.getInsurersForDropdown();
  }
}
