import { useState } from "react";
import { Send, Users, Music, Sparkles } from "lucide-react";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const inquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  company: z.string().trim().min(1, "Company is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  eventType: z.string().trim().min(1, "Please select an event type"),
  message: z.string().trim().max(1000).optional(),
});

const eventTypes = [
  "Team-Building Workshop",
  "Holiday Party",
  "Conference Entertainment",
  "Product Launch",
  "Private Celebration",
  "Other",
];

const Corporate = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", company: "", email: "", eventType: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = inquirySchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    toast({ title: "Inquiry sent!", description: "We'll be in touch soon." });
    setForm({ name: "", company: "", email: "", eventType: "", message: "" });
  };

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3">
            Corporate & Private Events
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Bring your team together through the power of singing. No experience required — just show up and have fun.
          </p>
        </div>

        {/* Value Props */}
        <div className="grid sm:grid-cols-3 gap-5 mb-14">
          {[
            { icon: Users, title: "Team-Building", desc: "Break the ice and build bonds through music.", color: "text-aqua" },
            { icon: Music, title: "No Experience Needed", desc: "We guide everyone — from shower singers to pros.", color: "text-pink" },
            { icon: Sparkles, title: "Unforgettable", desc: "A unique, joyful experience your team will remember.", color: "text-purple" },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-border bg-card p-6 text-center">
              <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
              <h3 className="font-heading font-bold text-foreground mb-1">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Inquiry Form */}
        <div className="max-w-lg mx-auto">
          <h2 className="font-heading font-bold text-xl text-foreground mb-6 text-center">
            Get in Touch
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { field: "name", label: "Your Name", type: "text" },
              { field: "company", label: "Company", type: "text" },
              { field: "email", label: "Email", type: "email" },
            ].map(({ field, label, type }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[field as keyof typeof form]}
                  onChange={(e) => update(field, e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder={label}
                />
                {errors[field] && <p className="text-xs text-destructive mt-1">{errors[field]}</p>}
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Event Type</label>
              <select
                value={form.eventType}
                onChange={(e) => update("eventType", e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select an event type</option>
                {eventTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              {errors.eventType && <p className="text-xs text-destructive mt-1">{errors.eventType}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message (optional)</label>
              <textarea
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Tell us about your event..."
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-warm text-primary-foreground font-semibold shadow hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Send className="w-4 h-4" />
              Send Inquiry
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Corporate;
