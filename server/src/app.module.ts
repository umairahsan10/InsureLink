import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './common/prisma/prisma.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CorporatesModule } from './modules/corporates/corporates.module';
import { DependentsModule } from './modules/dependents/dependents.module';
import { PatientsModule } from './modules/patients/patients.module';
import { HospitalsModule } from './modules/hospitals/hospitals.module';
import { InsurersModule } from './modules/insurers/insurers.module';
import { ClaimsModule } from './modules/claims/claims.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { PoliciesModule } from './modules/policies/policies.module';
import { VerificationModule } from './modules/verification/verification.module';

@Module({
  imports: [
    // Global config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database
    PrismaModule,

    // Feature modules — Dev A owns: auth, users, corporates, dependents, patients
    AuthModule,
    UsersModule,
    CorporatesModule,
    DependentsModule,
    PatientsModule,

    // Feature modules — Dev B owns: hospitals, insurers, claims, messaging,
    //   notifications, file-upload, analytics, audit
    HospitalsModule,
    InsurersModule,
    ClaimsModule,
    MessagingModule,
    NotificationsModule,
    FileUploadModule,
    AnalyticsModule,
    AuditModule,

    // Shared / cross-cutting
    PoliciesModule,
    VerificationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
