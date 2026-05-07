import { getCurrentUser } from "./current-user";

export async function getAdminUser() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

export async function requireAdminUser() {
  const user = await getAdminUser();
  if (!user) {
    throw new Error("Admin access required");
  }
  return user;
}
