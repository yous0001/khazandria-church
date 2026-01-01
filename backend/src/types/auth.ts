import type { UserRole } from "../constants/roles";

export interface JwtAuthPayload {
  userId: string;
  role: UserRole;
}
