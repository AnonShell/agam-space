export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  OWNER = 'owner',
}

export const USER_ROLE_RANK: Record<UserRole, number> = {
  [UserRole.USER]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.OWNER]: 3,
};

export enum UserStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
  DELETED = "deleted",
}