import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ChoirFaqProps {
  title?: string;
  subtitle?: string;
  /** When true, also outputs a FAQPage JSON-LD script tag. */
  includeJsonLd?: boolean;
  className?: string;
}

/**
 * Shared FAQ block used on multiple pages (home, location landings,
 * register, corporate, try-a-session). All copy comes from the existing
 * home.faq.* translation keys to keep one source of truth.
 */
const ChoirFaq = ({ title, subtitle, includeJsonLd = false, className = "" }: ChoirFaqProps) => {
  const { t } = useLanguage();

  const items = [
    { q: t("home.faq.q.cost"), a: t("home.faq.a.cost") },
    { q: t("home.faq.q.music"), a: t("home.faq.a.music") },
    { q: t("home.faq.q.shy"), a: t("home.faq.a.shy") },
    { q: t("home.faq.q.audition"), a: t("home.faq.a.audition") },
    { q: t("home.faq.q.kind"), a: t("home.faq.a.kind") },
    { q: t("home.faq.q.bring"), a: t("home.faq.a.bring") },
  ];

  return (
    <section className={`py-12 ${className}`}>
      <div className="container mx-auto max-w-3xl px-4">
        {title && (
          <h2 className="font-heading font-bold text-2xl md:text-3xl text-foreground mb-2 text-center">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-center text-muted-foreground mb-8">{subtitle}</p>
        )}
        <Accordion type="single" collapsible className="space-y-3">
          {items.map((item, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="rounded-2xl border border-border bg-card px-5"
            >
              <AccordionTrigger className="font-heading font-bold text-foreground text-left hover:no-underline py-4">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        {includeJsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: items.map((it) => ({
                  "@type": "Question",
                  name: it.q,
                  acceptedAnswer: { "@type": "Answer", text: it.a },
                })),
              }),
            }}
          />
        )}
      </div>
    </section>
  );
};

export default ChoirFaq;
