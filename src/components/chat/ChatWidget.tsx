import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { createConversation, saveMessage, streamChat, processAction } from "@/lib/chatService";
import { toast } from "@/hooks/use-toast";

type Message = { role: "user" | "assistant"; content: string };

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const initConversation = useCallback(async () => {
    if (!conversationId) {
      const id = await createConversation();
      setConversationId(id);
      return id;
    }
    return conversationId;
  }, [conversationId]);

  const handleOpen = async () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const id = await initConversation();
      const greeting = "Welcome to MedCare Clinic! 👋 I'm your AI appointment assistant. I can help you:\n\n- 📅 **Book** a new appointment\n- 🔄 **Reschedule** an existing appointment\n- ❌ **Cancel** an appointment\n- ℹ️ **Get info** about our doctors and services\n\nHow can I help you today?";
      setMessages([{ role: "assistant", content: greeting }]);
      await saveMessage(id, "assistant", greeting);
    }
    setTimeout(() => inputRef.current?.focus(), 300);
  };

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const convId = await initConversation();
    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    await saveMessage(convId, "user", trimmed);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user" && prev[prev.length - 2]?.content === trimmed) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        conversationId: convId,
        onDelta: upsertAssistant,
        onDone: async (fullText) => {
          setIsLoading(false);
          await saveMessage(convId, "assistant", fullText);

          // Process any actions
          const result = await processAction(fullText, convId);
          if (result?.success) {
            toast({ title: "Action Completed", description: result.message });
          }
        },
      });
    } catch (e: any) {
      setIsLoading(false);
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              className="h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                  <Bot className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary-foreground">MedCare Assistant</p>
                  <p className="text-xs text-primary-foreground/70">Online</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 mt-1">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-chat-user text-chat-user-foreground rounded-br-md"
                        : "bg-chat-agent text-chat-agent-foreground border rounded-bl-md"
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                        ul: ({ children }) => <ul className="ml-4 list-disc mb-1">{children}</ul>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        // Hide JSON action blocks from display
                        code: ({ children, className }) => {
                          const text = String(children);
                          if (text.startsWith("{") && text.includes('"action"')) return null;
                          return <code className={className}>{children}</code>;
                        },
                        pre: ({ children }) => {
                          const text = String((children as any)?.props?.children || "");
                          if (text.startsWith("{") && text.includes('"action"')) return null;
                          return <pre>{children}</pre>;
                        },
                      }}
                    >
                      {msg.content.replace(/```json[\s\S]*?```/g, "").trim()}
                    </ReactMarkdown>
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary mt-1">
                      <User className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-chat-agent border rounded-2xl rounded-bl-md px-3.5 py-2.5">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t px-3 py-2.5">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Type your message..."
                  className="flex-1 rounded-xl border bg-muted/50 px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                  disabled={isLoading}
                />
                <Button
                  onClick={send}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 rounded-xl"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
