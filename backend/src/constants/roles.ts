export const UserRoles = {
  superadmin: 'superadmin',
  admin: 'admin',
} as const;

export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];

export const ActivityRoles = {
  head: 'head',
  admin: 'admin',
} as const;

export type ActivityRole = (typeof ActivityRoles)[keyof typeof ActivityRoles];


