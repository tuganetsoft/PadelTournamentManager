import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

const teamEditSchema = z.object({
  name: z.string().min(1, "Team name is required"),
  player1: z.string().optional(),
  player2: z.string().optional(),
  seeded: z.boolean().default(false),
});

type TeamEditFormValues = z.infer<typeof teamEditSchema>;

interface Team {
  id: number;
  name: string;
  player1?: string;
  player2?: string;
  seeded?: boolean;
  categoryId: number;
}

export function TeamEditForm({ 
  team,
  tournamentId,
  children,
  onSuccess
}: { 
  team: Team;
  tournamentId: number;
  children: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<TeamEditFormValues>({
    resolver: zodResolver(teamEditSchema),
    defaultValues: {
      name: team.name,
      player1: team.player1 || "",
      player2: team.player2 || "",
      seeded: team.seeded || false,
    },
  });

  const updateTeamMutation = useMutation({
    mutationFn: async (data: TeamEditFormValues) => {
      const res = await apiRequest("PATCH", `/api/teams/${team.id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update team");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Team updated",
        description: "The team has been updated successfully.",
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/details`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: TeamEditFormValues) {
    updateTeamMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
          <DialogDescription>
            Update team details and seeded status.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Team Awesome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="player1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player 1</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="player2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player 2</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Jane Smith" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="seeded"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Mark as seeded team
                    </FormLabel>
                    <FormDescription>
                      Seeded teams will be distributed evenly across groups
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateTeamMutation.isPending}
              >
                {updateTeamMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}