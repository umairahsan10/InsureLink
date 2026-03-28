import {
	ConflictException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CurrentUserDto } from '../auth/dto/current-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import {
	PaginatedUsersResponseDto,
	UserResponseDto,
} from './dto/user-response.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
	private readonly logger = new Logger(UsersService.name);
	private readonly elevatedRoles: UserRole[] = [
		UserRole.corporate,
		UserRole.hospital,
		UserRole.insurer,
	];

	constructor(private readonly prisma: PrismaService) {}

	async getUserById(id: string, actor: CurrentUserDto): Promise<UserResponseDto> {
		this.logger.log(`getUserById requested actorId=${actor.id} targetUserId=${id}`);

		if (!this.canAccessUser(actor, id)) {
			throw new ForbiddenException('You are not allowed to view this user');
		}

		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) {
			throw new NotFoundException('User not found');
		}

		return this.toUserResponse(user);
	}

	async updateUser(
		id: string,
		dto: UpdateUserDto,
		actor: CurrentUserDto,
	): Promise<UserResponseDto> {
		this.logger.log(`updateUser requested actorId=${actor.id} targetUserId=${id}`);

		if (!this.canAccessUser(actor, id)) {
			throw new ForbiddenException('You are not allowed to update this user');
		}

		await this.ensureUserExists(id);

		try {
			const updated = await this.prisma.user.update({
				where: { id },
				data: {
					...(dto.firstName !== undefined ? { firstName: dto.firstName } : {}),
					...(dto.lastName !== undefined ? { lastName: dto.lastName } : {}),
					...(dto.phone !== undefined ? { phone: dto.phone } : {}),
					...(dto.dob !== undefined ? { dob: new Date(dto.dob) } : {}),
					...(dto.gender !== undefined ? { gender: dto.gender } : {}),
					...(dto.cnic !== undefined ? { cnic: dto.cnic } : {}),
					...(dto.address !== undefined ? { address: dto.address } : {}),
				},
			});

			this.logger.log(`updateUser succeeded actorId=${actor.id} targetUserId=${id}`);
			return this.toUserResponse(updated);
		} catch (error: unknown) {
			this.handlePrismaUpdateErrors(error);
			throw error;
		}
	}

	async listUsers(
		query: ListUsersQueryDto,
		actor: CurrentUserDto,
	): Promise<PaginatedUsersResponseDto> {
		this.logger.log(
			`listUsers requested actorId=${actor.id} role=${actor.role} page=${query.page ?? 1} limit=${query.limit ?? 20}`,
		);

		this.ensureElevated(actor);

		const page = query.page ?? 1;
		const limit = query.limit ?? 20;
		const skip = (page - 1) * limit;

		const where: Prisma.UserWhereInput = {
			...(query.role ? { userRole: query.role } : {}),
			...(query.search
				? {
						OR: [
							{ email: { contains: query.search, mode: 'insensitive' } },
							{ firstName: { contains: query.search, mode: 'insensitive' } },
							{ lastName: { contains: query.search, mode: 'insensitive' } },
							{ phone: { contains: query.search, mode: 'insensitive' } },
							{ cnic: { contains: query.search, mode: 'insensitive' } },
						],
					}
				: {}),
		};

		const [items, total] = await this.prisma.$transaction([
			this.prisma.user.findMany({
				where,
				skip,
				take: limit,
				orderBy: { createdAt: 'desc' },
			}),
			this.prisma.user.count({ where }),
		]);

		return {
			items: items.map((item) => this.toUserResponse(item)),
			total,
			page,
			limit,
		};
	}

	async deleteUser(id: string, actor: CurrentUserDto): Promise<{ success: boolean }> {
		this.logger.warn(`deleteUser requested actorId=${actor.id} targetUserId=${id}`);
		this.ensureElevated(actor);

		if (actor.id === id) {
			throw new ForbiddenException('You cannot delete your own account');
		}

		await this.ensureUserExists(id);

		try {
			await this.prisma.user.delete({ where: { id } });
			this.logger.warn(`deleteUser completed actorId=${actor.id} targetUserId=${id}`);
			return { success: true };
		} catch (error: unknown) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === 'P2003'
			) {
				throw new ConflictException(
					'User cannot be deleted because related records exist',
				);
			}
			throw error;
		}
	}

	async updateUserRole(
		id: string,
		dto: UpdateUserRoleDto,
		actor: CurrentUserDto,
	): Promise<UserResponseDto> {
		this.logger.log(
			`updateUserRole requested actorId=${actor.id} targetUserId=${id} newRole=${dto.role}`,
		);
		this.ensureElevated(actor);

		if (actor.id === id) {
			throw new ForbiddenException('You cannot change your own role');
		}

		await this.ensureUserExists(id);

		const updated = await this.prisma.user.update({
			where: { id },
			data: { userRole: dto.role },
		});

		this.logger.log(
			`updateUserRole succeeded actorId=${actor.id} targetUserId=${id} newRole=${dto.role}`,
		);
		return this.toUserResponse(updated);
	}

	private async ensureUserExists(id: string): Promise<void> {
		const user = await this.prisma.user.findUnique({
			where: { id },
			select: { id: true },
		});

		if (!user) {
			throw new NotFoundException('User not found');
		}
	}

	private ensureElevated(actor: CurrentUserDto): void {
		if (!this.elevatedRoles.includes(actor.role)) {
			throw new ForbiddenException('Insufficient role for this operation');
		}
	}

	private canAccessUser(actor: CurrentUserDto, targetUserId: string): boolean {
		if (actor.id === targetUserId) {
			return true;
		}

		return this.elevatedRoles.includes(actor.role);
	}

	private toUserResponse(user: {
		id: string;
		email: string;
		firstName: string;
		lastName: string | null;
		phone: string;
		userRole: UserRole;
		dob: Date | null;
		gender: 'Male' | 'Female' | 'Other' | null;
		cnic: string | null;
		address: string | null;
		createdAt: Date;
		updatedAt: Date;
		lastLoginAt: Date | null;
	}): UserResponseDto {
		return {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			...(user.lastName ? { lastName: user.lastName } : {}),
			phone: user.phone,
			userRole: user.userRole,
			...(user.dob ? { dob: user.dob } : {}),
			...(user.gender ? { gender: user.gender } : {}),
			...(user.cnic ? { cnic: user.cnic } : {}),
			...(user.address ? { address: user.address } : {}),
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
			...(user.lastLoginAt ? { lastLoginAt: user.lastLoginAt } : {}),
		};
	}

	private handlePrismaUpdateErrors(error: unknown): never {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === 'P2002'
		) {
			const target = Array.isArray(error.meta?.target)
				? error.meta?.target.join(', ')
				: 'unique field';
			throw new ConflictException(`Duplicate value for ${target}`);
		}

		throw error;
	}
}
