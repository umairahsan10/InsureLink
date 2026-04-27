import { Injectable } from '@nestjs/common';
import { PrismaService } from './common/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  getHello(): string {
    return 'Hello World!';
  }

  async getDatabaseHealth(): Promise<{
    ok: boolean;
    userCount: number | null;
  }> {
    try {
      const userCount = await this.prisma.user.count();
      return { ok: true, userCount };
    } catch {
      return { ok: false, userCount: null };
    }
  }
}
