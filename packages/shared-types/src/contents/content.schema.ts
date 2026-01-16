import { z } from 'zod';

export const RestoreItemSchema = z
  .object({
    nameHash: z.string().optional(),
    metadataEncrypted: z.string().optional(),
    fkWrapped: z.string().optional(),
    parentId: z.string().nullable().optional(),
  })
  .optional();

export type RestoreItem = z.infer<typeof RestoreItemSchema>;
