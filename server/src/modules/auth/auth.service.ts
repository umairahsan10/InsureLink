import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayloadDto } from './dto/jwt-payload.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async login(loginDto: LoginDto) {
    // TODO: Implement user validation logic
    const user = { id: 1, email: loginDto.email, roles: ['user'] };
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayloadDto = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    // TODO: Implement user registration logic
    const existingUser = null; // Check if user exists
    
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const user = { id: 1, email: registerDto.email, roles: ['user'] };
    
    const payload: JwtPayloadDto = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
    };
  }

  async refreshToken(user: any) {
    const payload: JwtPayloadDto = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    // TODO: Implement user validation logic
    const user = { id: 1, email, password: 'hashed_password', roles: ['user'] };
    
    if (user && user.password === password) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}


