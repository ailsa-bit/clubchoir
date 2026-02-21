import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Music, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  location: z.string().min(1, "Please choose a location"),
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(2000, "Message must be under 2000 characters"),
});

type ContactForm = z.infer<typeof contactSchema>;

const TryASession = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const form = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", location: "", message: "" },
  });

  const onSubmit = async (data: ContactForm) => {
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: data,
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Message sent!", description: "We'll be in touch soon." });
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

  return (
    <div className="min-h-[60vh] py-16 px-4">
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-10">
          <Music className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            Try a Session
          </h1>
          <p className="text-muted-foreground">
            Curious about Club Choir? Drop us a message and we'll get you
            singing in no time.
          </p>
        </div>

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">
              Thanks for reaching out!
            </h2>
            <p className="text-muted-foreground">
              We've received your message and will get back to you shortly.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jane@example.com"
                          {...field}
                        />
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
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us a bit about yourself and which location interests you…"
                          rows={4}
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
                      <Send className="w-4 h-4 mr-2" /> Send Message
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

export default TryASession;
