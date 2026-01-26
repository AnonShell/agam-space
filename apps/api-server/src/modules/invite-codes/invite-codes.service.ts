import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';

import { DATABASE_CONNECTION } from '@/database/database.providers';
import { InviteCodeEntity, inviteCodes } from '@/database/schema';
import {
  CreateInviteRequest,
  CreateInviteResponse,
  InviteCodeList,
  InviteCodeListSchema,
  ValidateInviteCodeResponse,
} from '@agam-space/shared-types';

@Injectable()
export class InviteCodesService {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: ReturnType<typeof drizzle>) {}

  private generateCode(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < length; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createInvite(createdBy: string, input: CreateInviteRequest): Promise<CreateInviteResponse> {
    const { email, expiresAt } = input;
    let { maxUses = 1 } = input;

    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    if (expiresAtDate && expiresAtDate < new Date()) {
      throw new BadRequestException('expiresAt must be in the future');
    }

    if (email) {
      maxUses = 1;
    }

    const id = this.generateCode();

    await this.db.insert(inviteCodes).values({
      id,
      createdBy,
      maxUses,
      email: email || null,
      expiresAt: expiresAtDate || null,
    });

    return {
      code: id,
      inviteUrl: `/signup?inviteCode=${id}`,
    };
  }

  async getEntityById(id: string): Promise<InviteCodeEntity | null> {
    const [row] = await this.db.select().from(inviteCodes).where(eq(inviteCodes.id, id)).limit(1);

    return row || null;
  }

  async validateInviteCode(id: string): Promise<ValidateInviteCodeResponse> {
    const invite = await this.getEntityById(id);
    if (!invite) {
      return { valid: false, reason: 'Invalid code' };
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
      return { valid: false, reason: 'Code expired' };
    }

    if (invite.currentUses >= invite.maxUses) {
      return { valid: false, reason: 'Code limit reached' };
    }

    return {
      valid: true,
      assignedEmail: invite.email,
    };
  }

  async useInviteCode(id: string): Promise<void> {
    const invite = await this.getEntityById(id);
    if (!invite) return;

    const newCurrentUses = invite.currentUses + 1;

    if (newCurrentUses >= invite.maxUses) {
      await this.db.delete(inviteCodes).where(eq(inviteCodes.id, id));
    } else {
      await this.db
        .update(inviteCodes)
        .set({ currentUses: newCurrentUses })
        .where(eq(inviteCodes.id, id));
    }
  }

  async listInvites(createdBy: string): Promise<InviteCodeList> {
    const rows = await this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.createdBy, createdBy))
      .orderBy(inviteCodes.createdAt);

    return InviteCodeListSchema.parse(rows);
  }

  async revokeInvite(id: string, createdBy: string): Promise<boolean> {
    const deleted = await this.db
      .delete(inviteCodes)
      .where(and(eq(inviteCodes.id, id), eq(inviteCodes.createdBy, createdBy)))
      .returning({ id: inviteCodes.id });

    return deleted.length > 0;
  }
}
