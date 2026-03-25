import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Clock, AlertTriangle, CheckCircle } from "lucide-react";

type Conversation = {
  id: string;
  patient_name: string | null;
  patient_phone: string | null;
  status: string;
  intent: string | null;
  summary: string | null;
  created_at: string;
};

type ChatMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

const statusIcon: Record<string, typeof MessageSquare> = {
  active: MessageSquare,
  escalated: AlertTriangle,
  resolved: CheckCircle,
};

const statusBadge: Record<string, string> = {
  active: "default",
  escalated: "destructive",
  resolved: "secondary",
};

export default function AdminConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    supabase
      .from("conversations")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setConversations(data || []));
  }, []);

  const loadMessages = async (convId: string) => {
    setSelected(convId);
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at");
    setMessages(data || []);
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px)]">
        {/* List */}
        <div className="w-80 border-r overflow-y-auto bg-card">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold text-foreground">Conversations</h2>
          </div>
          {conversations.map((c) => {
            const Icon = statusIcon[c.status] || MessageSquare;
            return (
              <button
                key={c.id}
                onClick={() => loadMessages(c.id)}
                className={`w-full text-left p-4 border-b hover:bg-muted/50 transition-colors ${
                  selected === c.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground truncate">
                    {c.patient_name || "Anonymous"}
                  </span>
                  <Badge variant={statusBadge[c.status] as any} className="ml-auto text-xs">
                    {c.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </button>
            );
          })}
          {conversations.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No conversations yet</div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
          {selected ? (
            <div className="space-y-3 max-w-2xl">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-chat-user text-chat-user-foreground"
                        : "bg-card border text-card-foreground"
                    }`}
                  >
                    {m.content.replace(/```json[\s\S]*?```/g, "").trim()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Select a conversation to view</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
