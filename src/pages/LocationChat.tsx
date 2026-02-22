import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const LOCATIONS = ["Montreal", "Arundel", "Saint-Hubert", "Pointe-Claire"];

const locationColors: Record<string, string> = {
  Montreal: "data-[state=active]:bg-[hsl(var(--pink))]/15 data-[state=active]:text-[hsl(var(--pink))]",
  Arundel: "data-[state=active]:bg-[hsl(var(--aqua))]/15 data-[state=active]:text-[hsl(var(--aqua))]",
  "Saint-Hubert": "data-[state=active]:bg-[hsl(var(--lime))]/15 data-[state=active]:text-[hsl(var(--lime-foreground))]",
  "Pointe-Claire": "data-[state=active]:bg-[hsl(var(--purple))]/15 data-[state=active]:text-[hsl(var(--purple))]",
};

interface ChatMessage {
  id: string;
  user_id: string;
  location: string;
  message: string;
  display_name: string;
  created_at: string;
}

const LocationChat = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading, user } = useAdmin();
  const { location: userLocation } = useProfile();
  const { toast } = useToast();

  const [activeLocation, setActiveLocation] = useState(LOCATIONS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  // Set default tab to user's location
  useEffect(() => {
    if (userLocation && LOCATIONS.includes(userLocation)) {
      setActiveLocation(userLocation);
    }
  }, [userLocation]);

  // Fetch display name
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setDisplayName(data?.display_name || user.email?.split("@")[0] || "Member");
      });
  }, [user]);

  // Fetch messages and subscribe to realtime
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("location", activeLocation)
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as ChatMessage[]);
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat-${activeLocation}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `location=eq.${activeLocation}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [...prev, payload.new as ChatMessage]);
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeLocation]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      location: activeLocation,
      message: newMessage.trim(),
      display_name: displayName,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  if (adminLoading) {
    return <div className="py-20 text-center text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center">
        <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
        <h1 className="font-heading font-bold text-2xl text-foreground mb-2">Members Only</h1>
        <p className="text-muted-foreground mb-4">Log in to chat with your choir community.</p>
        <Button variant="outline" onClick={() => navigate("/profile")}>Log In</Button>
      </div>
    );
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  };

  return (
    <div className="py-10 px-4">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
            Location Chat
          </h1>
          <p className="text-muted-foreground">
            Connect with members at your location
          </p>
        </div>

        <Tabs value={activeLocation} onValueChange={setActiveLocation}>
          <TabsList className="w-full grid grid-cols-4 mb-4">
            {LOCATIONS.map((loc) => (
              <TabsTrigger
                key={loc}
                value={loc}
                className={`text-xs sm:text-sm ${locationColors[loc] || ""}`}
              >
                {loc === "Saint-Hubert" ? "St-Hubert" : loc === "Pointe-Claire" ? "Pte-Claire" : loc}
              </TabsTrigger>
            ))}
          </TabsList>

          {LOCATIONS.map((loc) => (
            <TabsContent key={loc} value={loc}>
              <div className="rounded-2xl border border-border bg-card flex flex-col" style={{ height: "60vh" }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Start the conversation! 🎵
                    </p>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-semibold mb-0.5 opacity-80">
                              {msg.display_name}
                            </p>
                          )}
                          <p className="text-sm break-words">{msg.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[10px] ${isOwn ? "opacity-70" : "text-muted-foreground"}`}>
                              {formatTime(msg.created_at)}
                            </span>
                            {(isOwn || isAdmin) && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className={`${isOwn ? "opacity-60 hover:opacity-100" : "text-muted-foreground hover:text-destructive"} transition-opacity`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border p-3 flex gap-2">
                  <Input
                    placeholder="Type a message…"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    maxLength={1000}
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    size="icon"
                    className="shrink-0 rounded-full bg-gradient-warm text-primary-foreground"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default LocationChat;
