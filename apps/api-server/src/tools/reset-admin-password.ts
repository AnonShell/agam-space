// tools/reset-admin-password.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { UserService } from '@/modules/auth/user.service';
import { USER_ROLE_RANK, UserRole } from '@agam-space/shared-types';

async function bootstrap() {
  const usernameOrEmail = process.argv[2];
  const newPassword = process.argv[3];

  if (!usernameOrEmail || !newPassword) {
    console.error('Usage: node tools/reset-admin-password.js <username/email> <newPassword>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const userService = app.get(UserService);

  const user = await userService.findUserEntityForAuth(usernameOrEmail);
  if (!user || USER_ROLE_RANK[user.role] < USER_ROLE_RANK[UserRole.ADMIN]) {
    console.error('User not found or not an admin/owner.');
    process.exit(1);
  }

  await userService.overridePassword(user.id, newPassword);
  console.log(`✅ Password for admin ${usernameOrEmail} has been reset.`);
  await app.close();
}

bootstrap();
