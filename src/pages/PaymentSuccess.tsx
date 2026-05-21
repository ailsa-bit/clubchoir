import { CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";

const PaymentSuccess = () => {
  const { t } = useLanguage();

  return (
    <div className="py-20 px-4 flex items-center justify-center">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="text-center max-w-md">
        <CheckCircle className="w-16 h-16 text-lime mx-auto mb-6" />
        <h1 className="font-heading font-bold text-3xl text-foreground mb-3">
          {t("payment.success.title")}
        </h1>
        <p className="text-muted-foreground mb-8">
          {t("payment.success.desc")}
        </p>
        <Button asChild>
          <Link to="/events">{t("payment.success.back")}</Link>
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
