import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import TopBarLayout from "./_components/top-bar";

export default function SignedInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = auth();

  if (!user.userId) {
    return redirect("/sign-in");
  }

  return <TopBarLayout>{children}</TopBarLayout>;
}
