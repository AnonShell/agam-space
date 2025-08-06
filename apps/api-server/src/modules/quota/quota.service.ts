import { AppConfigService } from '@/config/config.service';
import { DATABASE_CONNECTION } from '@/database';
import { DrizzleTransaction } from '@/database/database.providers';
import { NewUserQuotaEntity, userQuotaDBSchema } from '@/database/schema/user-quota';
import { FilesService } from '@/modules/files/files.service';
import { UserQuota, UserQuotaSchema } from '@agam-space/shared-types';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { and, eq, lte, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

@Injectable()
export class QuotaService {
  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>,
    private readonly configService: AppConfigService,
  ) {}

  async userQuotaExists(userId: string): Promise<boolean> {
    const count = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(userQuotaDBSchema)
      .where(eq(userQuotaDBSchema.userId, userId))
      .limit(1);

    return count.length > 0 && count[0].count > 0;
  }

  async getUserQuota(userId: string): Promise<UserQuota | null> {
    const [quota] = await this.db
      .select()
      .from(userQuotaDBSchema)
      .where(eq(userQuotaDBSchema.userId, userId))
      .limit(1);

    return quota ? UserQuotaSchema.parse(quota) : null;
  }

  async createUserQuota(
    userId: string,
    quota?: {
      totalStorage?: number;
    },
    tx?: DrizzleTransaction
  ): Promise<UserQuota> {
    const exists = await this.userQuotaExists(userId);
    if (exists) {
      throw new Error(`Quota for user ${userId} already exists`);
    }

    const newQuota: NewUserQuotaEntity = {
      userId,
      totalStorageQuota: quota?.totalStorage || this.getDefaultQuota(),
      usedStorage: 0,
    };

    const db = tx ?? this.db;

    const [createdQuota] = await db.insert(userQuotaDBSchema).values(newQuota).returning();

    return UserQuotaSchema.parse(createdQuota);
  }

  async incrementUsedStorage(
    userId: string,
    size: number,
    tx?: DrizzleTransaction
  ): Promise<number | null> {
    const [result] = await (tx ?? this.db)
      .update(userQuotaDBSchema)
      .set({
        usedStorage: sql`${userQuotaDBSchema.usedStorage} + ${size}`,
      })
      .where(
        and(
          eq(userQuotaDBSchema.userId, userId),
          or(
            eq(userQuotaDBSchema.totalStorageQuota, 0),
            lte(
              sql`${userQuotaDBSchema.usedStorage} + ${size}`,
              userQuotaDBSchema.totalStorageQuota
            )
          )
        )
      )
      .returning({ updated: userQuotaDBSchema.usedStorage });

    return result?.updated ?? null;
  }

  async decrementUsedStorage(
    userId: string,
    size: number,
    tx?: DrizzleTransaction
  ): Promise<number | null> {
    const db = tx ?? this.db;

    const [result] = await db
      .update(userQuotaDBSchema)
      .set({
        usedStorage: sql`GREATEST(${userQuotaDBSchema.usedStorage} - ${size}, 0)`,
      })
      .where(eq(userQuotaDBSchema.userId, userId))
      .returning({ updated: userQuotaDBSchema.usedStorage });

    return result?.updated ?? null;
  }

  async resetUsedStorage(
    userId: string,
    value: number,
    tx?: DrizzleTransaction
  ): Promise<number | null> {
    const db = tx ?? this.db;

    const [result] = await db
      .update(userQuotaDBSchema)
      .set({
        usedStorage: value > 0 ? value : 0,
      })
      .where(eq(userQuotaDBSchema.userId, userId))
      .returning({ updated: userQuotaDBSchema.usedStorage });

    return result?.updated ?? null;
  }

  private getDefaultQuota(): number {
    const quota = 0; // can be replaced with a config value
    return Number(quota);
  }
}
