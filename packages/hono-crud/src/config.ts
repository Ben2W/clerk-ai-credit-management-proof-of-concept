/* eslint-disable @typescript-eslint/consistent-type-definitions */

import type { Context, Input } from "hono";

export type Bindings = {
  CLERK_SECRET_KEY: string;
  CLERK_PUBLISHABLE_KEY: string;
  OPENAI_API_KEY: string;
  MISTRAL_API_KEY: string;
};

export type HonoConfig = {
  Bindings: Bindings;
};

export type HonoContext<
  P extends string = string,
  I extends Input = Input,
> = Context<HonoConfig, P, I>;
