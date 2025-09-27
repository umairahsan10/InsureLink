export class JwtPayloadDto {
  sub: number;
  email: string;
  roles: string[];
  iat?: number;
  exp?: number;
}


