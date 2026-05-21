import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Send, Trash2, Megaphone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";

const LOCATIONS = ["Montreal", "Hudson", "Arundel", "Saint-Hubert", "Pointe-Claire"];

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
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userLocation && LOCATIONS.includes(userLocation)) {
      setActiveLocation(userLocation);
    }
  }, [userLocation]);

  // Non-admin members can only access their own location
  useEffect(() => {
    if (!adminLoading && !isAdmin && userLocation && LOCATIONS.includes(userLocation)) {
      setActiveLocation(userLocation);
    }
  }, [isAdmin, adminLoading, userLocation, activeLocation]);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const trimmed = newMessage.trim();
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      location: activeLocation,
      message: trimmed,
      display_name: displayName,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
      // Notify admin via edge function (fire-and-forget)
      supabase.functions.invoke("notify-chat-message", {
        body: { display_name: displayName, message: trimmed, location: activeLocation },
      }).catch(() => {});
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  const handleBroadcast = async () => {
    if (!broadcastMsg.trim() || !user) return;
    setBroadcasting(true);
    try {
      const inserts = LOCATIONS.map((loc) => ({
        user_id: user.id,
        location: loc,
        message: `📢 ${broadcastMsg.trim()}`,
        display_name: displayName,
      }));
      const { error } = await supabase.from("chat_messages").insert(inserts);
      if (error) throw error;
      toast({ title: "Broadcast sent!", description: "Message posted to all 4 locations." });
      setBroadcastMsg("");
      setBroadcastOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setBroadcasting(false);
    }
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
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return `Today ${time}`;
    if (diffDays === 1) return `Yesterday ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${time}`;
  };

  return (
    <div className="py-10 px-4">
      <Helmet><meta name="robots" content="noindex,nofollow" /></Helmet>
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <MessageCircle className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
            Location Chat
          </h1>
          <p className="text-muted-foreground">
            Connect with members at your location
          </p>
          {isAdmin && (
            <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-3">
                  <Megaphone className="w-4 h-4 mr-2" />
                  Broadcast to All
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Broadcast to All Locations</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  This message will be posted to all 4 location chats.
                </p>
                <Textarea
                  placeholder="Write your announcement…"
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={4}
                  maxLength={1000}
                />
                <Button
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastMsg.trim()}
                  className="w-full rounded-full bg-gradient-warm text-primary-foreground"
                >
                  {broadcasting ? "Sending…" : (
                    <>
                      <Megaphone className="w-4 h-4 mr-2" />
                      Send to All Locations
                    </>
                  )}
                </Button>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <Tabs value={activeLocation} onValueChange={setActiveLocation}>
          {isAdmin ? (
            <TabsList className="w-full grid grid-cols-4 mb-4">
              {LOCATIONS.map((loc) => (
                <TabsTrigger key={loc} value={loc} className="text-xs sm:text-sm">
                  {loc === "Saint-Hubert" ? "St-Hubert" : loc === "Pointe-Claire" ? "Pte-Claire" : loc}
                </TabsTrigger>
              ))}
            </TabsList>
          ) : (
            <div className="mb-4 text-sm text-muted-foreground text-center">
              📍 {activeLocation}
            </div>
          )}

          {LOCATIONS.map((loc) => (
            <TabsContent key={loc} value={loc}>
              <div className="rounded-2xl border border-border bg-card flex flex-col" style={{ height: "60vh" }}>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 && (
                    <p className="text-center text-muted-foreground text-sm py-8">
                      No messages yet. Start the conversation! 🎵
                    </p>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.user_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                        {!isOwn && (
                          <p className="text-xs font-semibold text-muted-foreground mb-1 ml-2">
                            {msg.display_name}
                          </p>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
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
