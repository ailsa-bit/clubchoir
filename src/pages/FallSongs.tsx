import { Link } from "react-router-dom";
import { ArrowLeft, Music } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Helmet } from "react-helmet-async";

const FallSongs = () => {
  const { t } = useLanguage();
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <Link to="/resources" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" />
        {t("resources.title")}
      </Link>
      <div className="text-center py-16">
        <Music className="w-12 h-12 mx-auto text-primary mb-4" />
        <h1 className="text-3xl font-heading font-bold mb-3">{t("songs.fall2026.title")}</h1>
        <p className="text-muted-foreground text-lg">{t("songs.fall2026.comingSoon")}</p>
      </div>
    </div>
  );
};

export default FallSongs;
