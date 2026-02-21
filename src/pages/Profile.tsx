import { User, Settings, Music } from "lucide-react";

const Profile = () => {
  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-warm mx-auto mb-4 flex items-center justify-center">
          <User className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="font-heading font-bold text-2xl text-foreground mb-1">Your Profile</h1>
        <p className="text-muted-foreground mb-8">Manage your Club Choir membership</p>

        <div className="space-y-3 text-left">
          {[
            { icon: Music, label: "My Sessions", desc: "View your rehearsal history" },
            { icon: User, label: "Account", desc: "Update your details" },
            { icon: Settings, label: "Preferences", desc: "Notifications & settings" },
          ].map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow text-left"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;
