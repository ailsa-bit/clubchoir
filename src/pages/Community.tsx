import { MessageCircle, Heart, Users } from "lucide-react";

const Community = () => {
  return (
    <div className="py-16 px-4">
      <div className="container mx-auto max-w-3xl text-center">
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-3">
          Club Choir Community
        </h1>
        <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
          This is where we connect between rehearsals. Share, chat, and stay in the loop.
        </p>

        <div className="grid sm:grid-cols-3 gap-5 mb-12">
          {[
            { icon: MessageCircle, label: "Group Chat", desc: "Stay connected with your choir family", color: "text-aqua" },
            { icon: Heart, label: "Shoutouts", desc: "Celebrate wins big and small", color: "text-pink" },
            { icon: Users, label: "Members", desc: "See who's singing with you", color: "text-purple" },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-card p-6">
              <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
              <h3 className="font-heading font-bold text-foreground mb-1">{item.label}</h3>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-gradient-hero p-8">
          <p className="font-heading font-semibold text-lg text-foreground mb-2">Community features coming soon</p>
          <p className="text-sm text-muted-foreground">
            We're building a space for sharing song ideas, photos, and more. Stay tuned!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Community;
