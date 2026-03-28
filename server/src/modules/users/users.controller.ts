import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import {
  PaginatedUsersResponseDto,
  UserResponseDto,
} from './dto/user-response.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Auth()
  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.getUserById(id, actor);
  }

  @Auth()
  @Put(':id')
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUser(id, dto, actor);
  }

  @Auth()
  @Roles('corporate', 'hospital', 'insurer')
  @Get()
  async listUsers(
    @Query() query: ListUsersQueryDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<PaginatedUsersResponseDto> {
    return this.usersService.listUsers(query, actor);
  }

  @Auth()
  @Roles('corporate', 'hospital', 'insurer')
  @Delete(':id')
  async deleteUser(
    @Param('id') id: string,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<{ success: boolean }> {
    return this.usersService.deleteUser(id, actor);
  }

  @Auth()
  @Roles('hospital', 'insurer')
  @Put(':id/role')
  async updateUserRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: CurrentUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateUserRole(id, dto, actor);
  }
}
