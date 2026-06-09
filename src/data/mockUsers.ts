import type { UserProfile, UserRole } from "./mock-bank";

export const mockUsers: Record<UserRole, UserProfile> = {
  manager: {
    id: "user-manager",
    username: "admin",
    password: "adminadmin",
    role: "manager",
    name: "车厘子行长",
    displayName: "车厘子行长",
  },
  depositor: {
    id: "user-depositor",
    username: "yezi",
    password: "Zhouge520",
    role: "depositor",
    name: "应展硕",
    displayName: "应展硕",
    avatarUrl: "/yezi-avatar.jpg",
  },
};

export function findMockUserByCredentials(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();

  return Object.values(mockUsers).find(
    (user) => user.username.toLowerCase() === normalizedUsername && user.password === password,
  );
}
