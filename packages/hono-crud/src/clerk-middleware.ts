import { Next } from "hono";
import { HonoContext } from "./config";
import { clerkMiddleware } from "@hono/clerk-auth";

export default function clerk(c: HonoContext, next: Next) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Create a new headers object with the modified Authorization header
      const newHeaders = new Headers(c.req.raw.headers);
      newHeaders.set('Authorization', authHeader.substring(7));
  
      // Create a new request with the modified headers
      c.req.raw = new Request(c.req.raw.url, {
        method: c.req.raw.method,
        headers: newHeaders,
        body: c.req.raw.body
      });
    }
  
    return clerkMiddleware({
      publishableKey: c.env.CLERK_PUBLISHABLE_KEY,
      secretKey: c.env.CLERK_SECRET_KEY,
    })(c, next);
  }