import { auth } from "@/lib/auth";

/** Every write (and read) API route must independently verify the session — spec section 9/14. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) return null;
  return session;
}
