import PageMeta from "@/components/PageMeta";
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
import { useLanguage } from "@/contexts/LanguageContext";

const LOCATIONS = [
  { value: "Montreal – Monday", label: "Montreal – Monday" },
  { value: "Hudson – Monday", label: "Hudson – Monday" },
  { value: "Arundel – Tuesday", label: "Arundel – Tuesday" },
  { value: "Saint-Hubert – Wednesday", label: "Saint-Hubert – Wednesday" },
  { value: "Pointe-Claire – Thursday", label: "Pointe-Claire – Thursday" },
];

const makeFormSchema = (t: (k: string) => string) =>
  z.object({
    memberName: z.string().trim().min(1, t("friend.validation.yourName")).max(100),
    friendName: z.string().trim().min(1, t("friend.validation.friendName")).max(100),
    friendEmail: z.string().trim().email(t("friend.validation.friendEmail")).max(255),
    location: z.string().min(1, t("friend.validation.location")),
    message: z
      .string()
      .trim()
      .max(2000, t("friend.validation.messageMax"))
      .optional(),
  });

const formSchema = z.object({
  memberName: z.string(),
  friendName: z.string(),
  friendEmail: z.string(),
  location: z.string(),
  message: z.string().optional(),
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
  const { t } = useLanguage();

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAuthState("logged-out");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setUserDisplayName(profile?.display_name || session.user.email?.split("@")[0] || "");
      if (membersLoading || adminLoading) return;
      if (isAdmin) { setAuthState("active"); return; }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { check(); });
    return () => subscription.unsubscribe();
  }, [members, membersLoading, isAdmin, adminLoading]);

  const form = useForm<BringAFriendForm>({
    resolver: zodResolver(formSchema),
    defaultValues: { memberName: userDisplayName, friendName: "", friendEmail: "", location: "", message: "" },
  });

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
          subject: "Bring a Friend Request",
          message: `BRING A FRIEND REQUEST\n\nMember: ${data.memberName}\nFriend's Name: ${data.friendName}\nFriend's Email: ${data.friendEmail}\nPreferred Location: ${data.location}\n\n${data.message || "(No additional message)"}`,
        },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Request sent!", description: "We'll be in touch with your friend soon." });
    } catch (err: any) {
      toast({ title: "Something went wrong", description: err.message || "Please try again later.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  if (authState === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  if (authState === "logged-out") {
    return (
      <div className="min-h-[60vh] py-16 px-4">
        <div className="container mx-auto max-w-lg text-center">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">{t("friend.title")}</h1>
          <p className="text-muted-foreground mb-6">{t("friend.loginRequired")}</p>
          <Link to="/login">
            <Button className="rounded-full bg-gradient-warm text-primary-foreground">
              <LogIn className="w-4 h-4 mr-2" /> {t("common.logIn")}
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
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">{t("friend.title")}</h1>
          <p className="text-muted-foreground">{t("friend.notActive")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] py-16 px-4">
      <PageMeta title="Bring a Friend – Club Choir" description="Invite a friend to try Club Choir for free! Share the joy of singing together." path="/bring-a-friend" />
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-10">
          <UserPlus className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">{t("friend.title")}</h1>
          <p className="text-muted-foreground">{t("friend.subtitle")}</p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">{t("friend.sent.title")}</h2>
            <p className="text-muted-foreground">{t("friend.sent.desc")}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField control={form.control} name="memberName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("friend.yourName")}</FormLabel>
                    <FormControl><Input placeholder={t("friend.yourName")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="friendName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("friend.friendName")}</FormLabel>
                    <FormControl><Input placeholder={t("friend.friendName")} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="friendEmail" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("friend.friendEmail")}</FormLabel>
                    <FormControl><Input type="email" placeholder="friend@example.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="location" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("friend.location")}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder={t("try.locationPlaceholder")} /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LOCATIONS.map((loc) => (
                          <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="message" render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("friend.messageOpt")}</FormLabel>
                    <FormControl><Textarea placeholder="…" rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" disabled={sending} className="w-full rounded-full bg-gradient-warm text-primary-foreground">
                  {sending ? t("friend.sending") : (<><Send className="w-4 h-4 mr-2" /> {t("friend.send")}</>)}
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
