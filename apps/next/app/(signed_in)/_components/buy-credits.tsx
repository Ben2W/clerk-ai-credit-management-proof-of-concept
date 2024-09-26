"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Plus } from "lucide-react";
import { addTokens } from "../_actions/add-tokens";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { z } from "zod";

export default function BuyCredits() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [addingTokens, setAddingTokens] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm({
    defaultValues: {
      creditAmount: 0,
    },
  });

  const handleAddTokens = async ({ creditAmount }: { creditAmount: any }) => {
    setAddingTokens(true);
    console.log(
      `Credit amount: ${creditAmount} with type ${typeof creditAmount}`,
    );

    // Making an any because the form is sending a string even though the input is a number
    const creditsAsInt = isNaN(Number(creditAmount))
      ? 0
      : parseInt(creditAmount, 10);

    await addTokens(creditsAsInt);
    await user?.reload();
    const updatedCredits =
      (user?.publicMetadata?.ai_credits as number | undefined) || 0;
    setAddingTokens(false);
    setIsDialogOpen(false);
    toast({
      description: `You bought ${creditAmount} credits to your account, you now have ${updatedCredits} credits.`,
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!isLoaded} size="sm">
          <span className="text-xs">Buy Credits</span>{" "}
          <Plus className="ml-1 h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buy Credits</DialogTitle>
          <DialogDescription>
            Enter the number of credits you want to buy:
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleAddTokens)}
            className="flex items-center space-x-2"
          >
            <FormField
              name="creditAmount"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      placeholder="Number of tokens"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={addingTokens}>
              {addingTokens ? "Adding..." : "Add"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
