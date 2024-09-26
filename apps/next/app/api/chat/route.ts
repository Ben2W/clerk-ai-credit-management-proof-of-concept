import { OpenAI } from "openai";
import { OpenAIStream, StreamingTextResponse } from "ai";
import { functions, runFunction } from "./functions";
import { auth } from "@clerk/nextjs/server";

export const runtime = "edge";

export async function POST(req: Request) {
  const { getToken } = auth();

  const token = await getToken();

  if (!token) {
    return new Response("Unauthorized", { status: 401 });
  }

  const openai = new OpenAI({
    apiKey: token,
    baseURL: "http://localhost:8080",
  });

  const { messages } = await req.json();

  // check if the conversation requires a function call to be made
  const initialResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true,
    functions,
    function_call: "auto",
  });

  // @ts-ignore
  const stream = OpenAIStream(initialResponse, {
    experimental_onFunctionCall: async (
      { name, arguments: args },
      createFunctionCallMessages,
    ) => {
      const result = await runFunction(name, args);
      const newMessages = createFunctionCallMessages(result);
      return openai.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages: [...messages, ...newMessages],
      });
    },
  });

  return new StreamingTextResponse(stream);
}
