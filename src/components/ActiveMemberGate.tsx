import { useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Lock, Clock, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActiveMemberGateProps {
  children: React.ReactNode;
}

const ActiveMemberGate = ({ children }: ActiveMemberGateProps) => {
  const { user, isAdmin, loading: adminLoading } = useAdmin();
  const { isActive, loading: profileLoading } = useProfile();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (adminLoading || profileLoading) {
    return <div className="py-20 text-center text-muted-foreground">{t("common.loading")}</div>;
  }

  // Not logged in
  if (!user) {
    return (
      <div className="py-20 px-4 text-center">
        <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Members Only</h1>
        <p className="text-muted-foreground mb-6">Sign in to access this page.</p>
        <Button onClick={() => navigate("/login")}>
          <LogIn className="w-4 h-4 mr-2" /> Sign In
        </Button>
      </div>
    );
  }

  // Admins always have access
  if (isAdmin) {
    return <>{children}</>;
  }

  // Logged in but not active
  if (!isActive) {
    return (
      <div className="py-20 px-4 text-center">
        <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Account Pending</h1>
        <p className="text-muted-foreground mb-2 max-w-md mx-auto">
          Your account is awaiting approval. An admin will review your registration shortly.
        </p>
        <p className="text-sm text-muted-foreground">
          If you believe this is an error, please contact <a href="mailto:ailsa@clubchoir.ca" className="text-primary hover:underline">ailsa@clubchoir.ca</a>
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ActiveMemberGate;
