"use client";

import { useRef, useState } from "react";
import { useChat } from "ai/react";
import va from "@vercel/analytics";
import clsx from "clsx";
import { LoadingCircle, SendIcon } from "./_components/icons";
import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Textarea from "react-textarea-autosize";
import { useUser } from "@clerk/nextjs";

import { useToast } from "@/hooks/use-toast";
import BuyCredits from "./_components/buy-credits";
const examples = [
  "What's the airspeed velocity of an unladen swallow? Be as specific and verbose as possible.",
  "How many licks does it take to get to the center of a Tootsie Pop? Be as specific and verbose as possible.",
  "If a tree falls in a forest and no one is around to hear it, does it make a sound? Be as specific and verbose as possible.",
];

export default function Chat() {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { user, isLoaded: userLoaded } = useUser();
  const { toast } = useToast();

  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    onResponse: (response) => {
      if (response.status === 429) {
        toast({
          title: "You have reached your request limit for the day.",
          variant: "destructive",
        });
        va.track("Rate limited");
        return;
      } else {
        va.track("Chat initiated");
      }
    },
    onError: (error) => {
      va.track("Chat errored", {
        input,
        error: error.message,
      });
    },
    onFinish: async () => {
      if (user) {
        /*
         * Since we don't have a realtime way to know exactly when the metadata updates
         * We wait a bit for the metadata to update on the server, then reload the user.
         */
        await new Promise((resolve) => setTimeout(resolve, 500));
        await user.reload();
      }
    },
  });

  const credits = (user?.publicMetadata?.ai_credits as number) || 0;

  const outOfCredits = credits <= 0;

  const disabled =
    isLoading || !userLoaded || outOfCredits || input.length === 0;

  const Messages = () => {
    if (messages.length === 0) {
      return (
        <div className="border-gray-200sm:mx-0 mx-5 mt-20 max-w-screen-md rounded-md border sm:w-full">
          <div className="flex flex-col space-y-4 p-7 sm:p-10">
            <h1 className="text-lg font-semibold text-black">
              Welcome to the Clerk AI Token Demo
            </h1>
            <p className="text-gray-500">
              This is a proof of concept demonstrating how Clerk auth can be
              used to help manage user access to LLM models.
            </p>
            <p className="text-gray-500">
              In this demo, instead of using the OpenAI API key directly, there
              is an API service (hosted on localhost:8080) that proxies requests
              to OpenAI, but before forwarding the request to OpenAI it uses the
              user's Clerk{" "}
              <a
                href="https://clerk.com/docs/references/nextjs/auth-object#gettoken"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4 transition-colors hover:text-black"
              >
                token
              </a>{" "}
              to check if the user has enough credits in the public metadata to
              make the request.
            </p>
          </div>
          <div className="flex flex-col space-y-4 border-t border-gray-200 bg-gray-50 p-7 sm:p-10">
            {examples.map((example, i) => (
              <button
                key={i}
                className="rounded-md border border-gray-200 bg-white px-5 py-3 text-left text-sm text-gray-500 transition-all duration-75 hover:border-black hover:text-gray-700 active:bg-gray-50"
                onClick={() => {
                  setInput(example);
                  inputRef.current?.focus();
                }}
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return messages.map((message, i) => (
      <div
        key={i}
        className={clsx(
          "flex w-full items-center justify-center border-b border-gray-200 py-8",
          message.role === "user" ? "bg-white" : "bg-gray-100",
        )}
      >
        <div className="flex w-full max-w-screen-md items-start space-x-4 px-5 sm:px-0">
          <div
            className={clsx(
              "p-1.5 text-white",
              message.role === "assistant" ? "bg-green-500" : "bg-black",
            )}
          >
            {message.role === "user" ? <User width={20} /> : <Bot width={20} />}
          </div>
          <ReactMarkdown
            className="prose mt-1 w-full break-words prose-p:leading-relaxed"
            remarkPlugins={[remarkGfm]}
            components={{
              // open links in new tab
              a: (props) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    ));
  };

  return (
    <main className="flex flex-col items-center justify-between pb-40">
      <Messages />
      <div className="fixed bottom-0 flex w-full flex-col items-center space-y-3 bg-gradient-to-b from-transparent via-gray-100 to-gray-100 p-5 pb-3 sm:px-0">
        {userLoaded && outOfCredits ? (
          <div className="flex w-full max-w-screen-md items-center justify-between rounded-xl border-2 border-destructive bg-background px-8 py-4 text-center font-bold">
            <span>Out of Credits</span>
            <BuyCredits />
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="relative w-full max-w-screen-md rounded-xl border border-gray-200 bg-white px-4 pb-2 pt-3 shadow-lg sm:pb-3 sm:pt-4"
          >
            <Textarea
              ref={inputRef}
              tabIndex={0}
              required
              rows={1}
              autoFocus
              placeholder="Send a message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  if (disabled) {
                    if (outOfCredits) {
                      toast({
                        title: "You have no credits available",
                        variant: "destructive",
                      });
                    }
                    e.preventDefault();
                    return;
                  }
                  formRef.current?.requestSubmit();
                  e.preventDefault();
                }
              }}
              spellCheck={false}
              className="w-full pr-10 focus:outline-none"
            />
            <button
              className={clsx(
                "absolute inset-y-0 right-3 my-auto flex h-8 w-8 items-center justify-center rounded-md transition-all",
                disabled
                  ? "cursor-not-allowed bg-white"
                  : "bg-green-500 hover:bg-green-600",
              )}
              disabled={disabled}
            >
              {isLoading ? (
                <LoadingCircle />
              ) : (
                <SendIcon
                  className={clsx(
                    "h-4 w-4",
                    input.length === 0 ? "text-gray-300" : "text-white",
                  )}
                />
              )}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
