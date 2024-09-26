# Clerk AI Token Demo

## Problem

When building AI features, you typically need to:

- **Authorize** users to use the feature
- Manage credits or subscriptions
- Handle billing
- Rate limit the model

This complexity often requires sophisticated auth, billing, and credit management systems.

## Proposal

Using Clerk we can offload this complexity to an AI proxy that uses the user's Clerk session token in the request.

For example:

This

```typescript
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
```

Becomes this:

```typescript
  const { getToken } = auth();

  const token = await getToken();

  const openai = new OpenAI({
    apiKey: token,
    baseURL: "http://localhost:8080",
  });
```

### Demo

I built this project to show a proof of concept for what this might look like.

## _Important Note_

This demo is not production-ready. It retrieves and updates the Clerk user data on every request, which would quickly hit rate limits in a real-world scenario. There are also potential race conditions, and the overall architecture is designed for demonstration purposes only.

## Running the Application

To run this application, you'll need [pnpm](https://pnpm.io/) installed on your system.

1. Clone the repository
2. Run `pnpm i` in the root directory to install dependencies
3. Run `pnpm dev` in the root directory to start the application

### Setting up environment variables

Since this is a monorepo (a demo web app and a proof-of-concept proxy API), you'll need to set up environment variables for both.

#### For the Next.js app:

1. Create a `.env` file in the `apps/next` directory
2. Copy the contents of `.env.example` into this new file
3. Add your Clerk secret key and publishable key

#### For the Hono API:

1. Create a `.dev.vars` file in the `packages/hono-crud` directory
2. Reference the `.dev.example` file for the required variables
3. Add your Clerk secret key, Clerk publishable key, and OpenAI API key

**Note:** The OpenAI API key will need you to add credits to your OpenAI account.

Once you've set up the environment variables, you should be able to run both the Next.js app and the Hono API.

## Project Structure

The project consists of two main components:

1. A Next.js web application (located in `apps/next`)
2. A Cloudflare Workers API (located in `packages/hono-crud`)
