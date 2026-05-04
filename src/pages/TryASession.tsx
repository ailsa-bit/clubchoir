import PageMeta from "@/components/PageMeta";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { choirPhotos } from "@/assets/photos";

const previewPhoto = choirPhotos.find((p) => p.id === "hudson-lyrics") ?? choirPhotos[0];

const LOCATIONS = [
  { value: "Montreal – Monday", label: "Montreal – Monday" },
  { value: "Hudson – Monday", label: "Hudson – Monday" },
  { value: "Arundel – Tuesday", label: "Arundel – Tuesday" },
  { value: "Saint-Hubert – Wednesday", label: "Saint-Hubert – Wednesday" },
  { value: "Pointe-Claire – Thursday", label: "Pointe-Claire – Thursday" },
];

const makeContactSchema = (t: (k: string) => string) =>
  z.object({
    name: z.string().trim().min(1, t("try.validation.name")).max(100),
    email: z.string().trim().email(t("try.validation.email")).max(255),
    location: z.string().min(1, t("try.validation.location")),
    message: z
      .string()
      .trim()
      .min(1, t("try.validation.message"))
      .max(2000, t("try.validation.messageMax")),
  });

const contactSchema = z.object({
  name: z.string(),
  email: z.string(),
  location: z.string(),
  message: z.string(),
});

type ContactForm = z.infer<typeof contactSchema>;

const TryASession = () => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  const form = useForm<ContactForm>({
    resolver: zodResolver(makeContactSchema(t)),
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
      toast({ title: t("try.toast.sent.title"), description: t("try.toast.sent.desc") });
    } catch (err: any) {
      toast({
        title: t("common.something.wrong"),
        description: err.message || t("common.try.again"),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[60vh] py-16 px-4">
      <PageMeta title="Try a Free Session – Club Choir" description="Try a free Club Choir session! No audition, no experience needed. Come sing with us at any of our 4 Quebec locations." path="/try" />
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-8">
          <Music className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
            {t("try.title")}
          </h1>
          <p className="text-muted-foreground">
            {t("try.subtitle")}
          </p>
        </div>

        {previewPhoto && (
          <figure className="mb-10 rounded-2xl overflow-hidden border border-border shadow-sm">
            <img
              src={previewPhoto.wide}
              alt={previewPhoto.alt.en}
              loading="lazy"
              decoding="async"
              className="w-full h-48 md:h-56 object-cover"
            />
            <figcaption className="px-4 py-2.5 text-xs text-muted-foreground bg-muted/40 text-center">
              A real Club Choir session in progress — that's exactly what you're walking into.
            </figcaption>
          </figure>
        )}

        {sent ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <h2 className="font-heading font-bold text-xl text-foreground mb-2">
              {t("try.thanks.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("try.thanks.desc")}
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
                      <FormLabel>{t("try.name")}</FormLabel>
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
                      <FormLabel>{t("try.email")}</FormLabel>
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
                      <FormLabel>{t("try.location")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t("try.locationPlaceholder")} />
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
                      <FormLabel>{t("try.message")}</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder={t("try.messagePlaceholder")}
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
                  {sending ? t("try.sending") : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> {t("try.send")}
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
