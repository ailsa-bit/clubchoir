import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Send, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMembers } from "@/hooks/use-members";
import { useAdmin } from "@/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const LOCATIONS = [
  { value: "Montreal – Monday", label: "Montreal – Monday" },
  { value: "Arundel – Tuesday", label: "Arundel – Tuesday" },
  { value: "Saint-Hubert – Wednesday", label: "Saint-Hubert – Wednesday" },
  { value: "Pointe-Claire – Thursday", label: "Pointe-Claire – Thursday" },
];

const formSchema = z.object({
  memberName: z.string().trim().min(1, "Your name is required").max(100),
  friendName: z.string().trim().min(1, "Friend's name is required").max(100),
  friendEmail: z.string().trim().email("Invalid email address").max(255),
  location: z.string().min(1, "Please choose a location"),
  message: z
    .string()
    .trim()
    .max(2000, "Message must be under 2000 characters")
    .optional(),
});

type BringAFriendForm = z.infer<typeof formSchema>;

const BringAFriend = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [authState, setAuthState] = useState<"loading" | "logged-out" | "not-active" | "active">("loading");
  const [userDisplayName, setUserDisplayName] = useState("");
  const { members, loading: membersLoading } = useMembers();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAuthState("logged-out");
        return;
      }

      // Get profile display name
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setUserDisplayName(profile?.display_name || session.user.email?.split("@")[0] || "");

      // Wait for data to load
      if (membersLoading || adminLoading) return;

      // Admins always have access
      if (isAdmin) {
        setAuthState("active");
        return;
      }

      // Check by matching user email against CSV emails, or display_name against names
      const email = session.user.email?.toLowerCase() || "";
      const displayName = profile?.display_name?.toLowerCase() || "";

      const isActive = members.some(
        (m) =>
          m.status === "ACTIVE" &&
          (`${m.firstName} ${m.lastName}`.toLowerCase() === displayName ||
           `${m.firstName} ${m.lastName}`.toLowerCase() === email)
      );

      setAuthState(isActive ? "active" : "not-active");
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => subscription.unsubscribe();
  }, [members, membersLoading, isAdmin, adminLoading]);

  const form = useForm<BringAFriendForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { memberName: userDisplayName, friendName: "", friendEmail: "", location: "", message: "" },
  });

  // Update memberName default when displayName loads
  useEffect(() => {
    if (userDisplayName && !form.getValues("memberName")) {
      form.setValue("memberName", userDisplayName);
    }
  }, [userDisplayName, form]);

  const onSubmit = async (data: BringAFriendForm) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: {
          name: data.memberName,
          email: data.friendEmail,
          location: data.location,
          message: `BRING A FRIEND REQUEST\n\nMember: ${data.memberName}\nFriend's Name: ${data.friendName}\nFriend's Email: ${data.friendEmail}\nPreferred Location: ${data.location}\n\n${data.message || "(No additional message)"}`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Request sent!", description: "We'll be in touch with your friend soon." });
    } catch (err: any) {
      toast({
        title: "Something went wrong",
        description: err.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (authState === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (authState === "logged-out") {
    return (
      <div className="min-h-[60vh] py-16 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            Bring a Friend
          </h1>
          <p className="text-muted-foreground mb-6">
            This feature is available to active Club Choir members. Please log in to continue.
          </p>
          <Link to="/login">
            <Button className="rounded-full bg-gradient-warm text-primary-foreground">
              <LogIn className="w-4 h-4 mr-2" /> Log In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (authState === "not-active") {
    return (
      <div className="min-h-[60vh] py-16 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            Bring a Friend
          </h1>
          <p className="text-muted-foreground">
            This feature is available to active Club Choir members only. If you believe this is an error, please contact us.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-16 px-4">
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-10">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            Bring a Friend
          </h1>
          <p className="text-muted-foreground">
            Know someone who'd love to sing? Invite them to try a session with you!
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">
              Invitation sent!
            </h2>
            <p className="text-muted-foreground">
              We'll reach out to your friend and get them set up for a session.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="memberName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="friendName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Friend's name</FormLabel>
                      <FormControl>
                        <Input placeholder="Their name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="friendEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Friend's email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="friend@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred location</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a location…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LOCATIONS.map((loc) => (
                            <SelectItem key={loc.value} value={loc.value}>
                              {loc.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Anything else we should know…"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-full bg-gradient-warm text-primary-foreground"
                >
                  {sending ? "Sending…" : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Send Invitation
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BringAFriend;
