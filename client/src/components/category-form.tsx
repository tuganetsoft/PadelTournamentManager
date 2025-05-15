import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertCategorySchema, GameFormats, CategoryStatus } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const categorySchema = insertCategorySchema.extend({
  tournamentId: z.number(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export function CategoryForm({ 
  tournamentId, 
  children,
  onSuccess
}: { 
  tournamentId: number;
  children: React.ReactNode;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      tournamentId,
      format: GameFormats.GROUPS,
      matchDuration: 60,
      status: CategoryStatus.REGISTRATION_OPEN
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormValues) => {
      const res = await apiRequest("POST", "/api/categories", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Category created",
        description: "Your category has been created successfully.",
      });
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/details`] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating category",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(values: CategoryFormValues) {
    createCategoryMutation.mutate(values);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Create a new tournament category with specific game format.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Men's A" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter a descriptive name for this category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Game Format</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a game format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={GameFormats.GROUPS}>Round Robin Groups</SelectItem>
                      <SelectItem value={GameFormats.SINGLE_ELIMINATION}>Single Elimination</SelectItem>
                      <SelectItem value={GameFormats.GROUPS_AND_ELIMINATION}>Hybrid (Groups + Elimination)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How matches will be structured for this category
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="matchDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={30} 
                      max={180} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Estimated duration of matches for scheduling
                  </FormDescription>
                  <FormMessage />
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
                disabled={createCategoryMutation.isPending}
              >
                {createCategoryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Category"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}