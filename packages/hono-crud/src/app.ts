import { Hono } from "hono";
import { HonoConfig, HonoContext } from "./config";
import { cors } from "hono/cors";
import { getAuth } from "@hono/clerk-auth";
import clerk from "./clerk-middleware";
const app = new Hono<HonoConfig>();

app
  .use("*", cors({ origin: "*", maxAge: 86400 }))
  .use("*", clerk)
  .all("*", async (c) => {
    const auth = getAuth(c);

    if (!auth?.userId) {
      return c.text("Unauthorized", 401);
    }
    const clerk = c.get("clerk");

    const user = await clerk.users.getUser(auth.userId);
    const currentCredits =
      (user.publicMetadata.ai_credits as number | undefined) || 0;

    if (currentCredits <= 0) {
      return c.text("No credits available", 400);
    }

    return proxy(c);
  });

async function proxy(c: HonoContext) {
  const headers = new Headers(c.req.header());
  headers.set("Authorization", `Bearer ${c.env.OPENAI_API_KEY}`);

  const url = new URL(`https://api.openai.com/v1${c.req.path}`);

  const requestBody =
    c.req.method !== "GET" ? JSON.stringify(await c.req.json()) : null;

  const response = await fetch(url, {
    method: c.req.method,
    headers: headers,
    body: requestBody,
  });

  return processResponseInRealTime(c, response);
}

async function processResponseInRealTime(c: HonoContext, response: Response) {
  const contentType = response.headers.get("content-type");
  let wordCount = 0;

  if (contentType && contentType.includes("text/event-stream")) {
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = (await reader?.read()) ?? {
            done: true,
            value: undefined,
          };
          if (done) {
            const userId = getAuth(c)?.userId;
            const cost = Math.ceil(wordCount);
            if (userId) {
              await subtractCredits({ c, userId, cost });
            }
            console.log(`Total words: ${wordCount}, Cost: ${cost} credits`);
            controller.close();
            break;
          }
          const chunk = decoder.decode(value);
          wordCount += countWords(chunk);
          controller.enqueue(value);
        }
      },
    });

    return new Response(stream, {
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
    });
  } else {
    try {
      const body = await response.json();
      console.log("Response:", JSON.stringify(body));
    } catch (error) {
      console.error("Error parsing response:", await response.text());
    }
    return response;
  }
}

function countWords(text: string): number {
  // Remove data: prefixes and event: lines
  const cleanText = text
    .replace(/^data: /gm, "")
    .replace(/^event:.*$/gm, "")
    .trim();
  // Split by whitespace and filter out empty strings
  return cleanText.split(/\s+/).filter((word) => word.length > 0).length;
}

async function subtractCredits({
  c,
  userId,
  cost,
}: {
  c: HonoContext;
  userId: string;
  cost: number;
}) {
  const clerk = c.get("clerk");

  const user = await clerk.users.getUser(userId);
  const currentCredits =
    (user.publicMetadata.ai_credits as number | undefined) || 0;

  const newCredits = Math.max(currentCredits - cost, 0);

  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      ai_credits: newCredits,
    },
  });

  return newCredits;
}

export default {
  fetch: app.fetch,
};
