import { Module } from '@nestjs/common';
import { AuthModule } from '../modules/auth/auth.module';
import { AppGateway } from './gateway';

@Module({
  imports: [AuthModule],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class WebsocketsModule {}



