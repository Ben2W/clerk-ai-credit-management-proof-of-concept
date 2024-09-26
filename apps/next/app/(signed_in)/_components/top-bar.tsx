"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import BuyCredits from "./buy-credits";
export default function TopBarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();

  const credits = (user?.publicMetadata?.ai_credits as number) || 0;

  return (
    <div>
      <div className="top-bar flex items-center space-x-4 p-4">
        {isLoaded ? (
          <UserButton />
        ) : (
          <Skeleton className="h-8 w-8 rounded-full" />
        )}
        <div
          className={cn("flex items-center space-x-2 rounded-md border p-2", {
            "border-gray-200": credits > 0 || !isLoaded,
            "border-destructive": credits <= 0 && isLoaded,
          })}
        >
          <span className="fond-bold pl-2 text-sm font-bold">
            Credits available:{" "}
            {isLoaded ? (
              credits
            ) : (
              <Skeleton className="inline-block h-4 w-12" />
            )}
          </span>
          <BuyCredits />
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
