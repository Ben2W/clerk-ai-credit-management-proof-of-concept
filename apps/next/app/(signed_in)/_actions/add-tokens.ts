"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";

export async function addTokens(amount: number) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const user = await clerkClient.users.getUser(userId);
  const newAmount =
    ((user.publicMetadata.ai_credits as number | undefined) || 0) + amount;
  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      ai_credits: newAmount,
    },
  });
}
