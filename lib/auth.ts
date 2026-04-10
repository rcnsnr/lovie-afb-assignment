import { getIronSession, IronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  email: string;
  name: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "p2p-session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}

/**
 * Returns the session if authenticated, or throws a 401 Response.
 * Use in Server Components and Route Handlers that require auth.
 */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session.userId) {
    throw new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  return { userId: session.userId, email: session.email, name: session.name };
}
