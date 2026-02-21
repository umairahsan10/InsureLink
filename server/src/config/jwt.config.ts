import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  secretOrKey: process.env.JWT_SECRET,
  accessTokenExpiry: process.env.JWT_EXPIRES_IN || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));



