import type { DefaultSession, DefaultUser } from "next-auth";
import type { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    username?: string;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      username?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/types" {
  interface User {
    id: string;
    username?: string;
    role?: string;
  }

  interface Session {
    user: {
      id: string;
      username?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string;
    username?: string;
    role?: string;
  }
}
