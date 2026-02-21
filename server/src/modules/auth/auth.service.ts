import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  /**
   * User Login
   */
  async login(loginDto: LoginDto): Promise<TokenResponseDto> {
    const { email, password } = loginDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        corporate: true,
        hospital: true,
        insurer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    let organizationId: string | undefined;
    if (user.userRole === 'corporate' && user.corporate) {
      organizationId = user.corporate.id;
    } else if (user.userRole === 'hospital' && user.hospital) {
      organizationId = user.hospital.id;
    } else if (user.userRole === 'insurer' && user.insurer) {
      organizationId = user.insurer.id;
    }

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.userRole,
      organizationId,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || undefined,
        role: user.userRole,
        organizationId,
      },
    };
  }

  /**
   * User Registration
   */
  async register(registerDto: RegisterDto): Promise<TokenResponseDto> {
    const { email, password, firstName, lastName, phone, userRole, dob, gender } =
      registerDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (!this.isPasswordStrong(password)) {
      throw new BadRequestException(
        'Password must be 8+ chars with uppercase, lowercase, and number',
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName: lastName || null,
        phone,
        userRole,
        dob: dob ? new Date(dob) : null,
        gender: gender || null,
      },
    });

    const tokens = this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.userRole,
      organizationId: undefined,
    });

    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName || undefined,
        role: user.userRole,
      },
    };
  }

  /**
   * Refresh Tokens
   */
  async refreshToken(refreshToken: string): Promise<TokenResponseDto> {
    try {
      const payload = this.jwtService.verify<JwtPayloadDto>(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const tokens = this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        role: payload.role,
        organizationId: payload.organizationId,
      });

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Get Current User
   */
  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        corporate: true,
        hospital: true,
        insurer: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    let organizationId: string | undefined;
    if (user.userRole === 'corporate' && user.corporate) {
      organizationId = user.corporate.id;
    } else if (user.userRole === 'hospital' && user.hospital) {
      organizationId = user.hospital.id;
    } else if (user.userRole === 'insurer' && user.insurer) {
      organizationId = user.insurer.id;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName || undefined,
      phone: user.phone,
      userRole: user.userRole,
      organizationId,
      dob: user.dob || undefined,
      gender: user.gender || undefined,
      cnic: user.cnic || undefined,
      address: user.address || undefined,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || undefined,
    };
  }

  /**
   * Helper: Generate both tokens
   */
  private generateTokens(payload: JwtPayloadDto) {
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.accessTokenExpiry'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.refreshTokenExpiry'),
    });

    return { accessToken, refreshToken };
  }

  /**
   * Helper: Check if password is strong
   */
  private isPasswordStrong(password: string): boolean {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  /**
   * Helper: Validate user for Passport (optional)
   */
  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }

    return null;
  }
}


