'use client';
import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { DefaultChatTransport } from 'ai';
import { AuthStorage } from '@/types/user';
import { LoaderIcon } from '@/components/ui/LoaderIcon';
const API = import.meta.env.VITE_API_URL;
import ReactMarkdown from 'react-markdown';
import remarkGfm from "remark-gfm";

// ===== Component =====
export default function ChatBot() {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const {messages, sendMessage, status} = useChat({
    transport: new DefaultChatTransport({
        api: `${API}/chisaAI/v2/chat`,
        body: {
            access_token: AuthStorage.getUserToken() || ''
        }
    })
  })
  
  useEffect(() => {
    const load = async () => {

        const user = AuthStorage.getTokenWithAuth()

        if (!user) {
            setError("Phiên đã hết hạn, vui lòng đăng nhập lại")
        }
        setLoading(false)
    }
    load()
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessageHandler = (message: string) => {
    if (status !== 'ready') return;
    if (!message.trim()) return;
    const userMsg = {
        id: crypto.randomUUID().toString(),
        role: 'user',
        text: message
    }
    sendMessage(userMsg);
    setInput("");
  }

  if (loading) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <Card className="w-full max-w-md rounded-2xl shadow-lg">
                <CardContent className="p-6 text-center">
                    <LoaderIcon />
                    <p className="text-sm sm:text-base">Đang kiểm tra kết nối đến máy chủ...</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  if (error) {
    return (
        <div className="flex h-full w-full items-center justify-center p-4">
            <Card className="w-full max-w-md rounded-2xl shadow-lg">
                <CardContent className="p-6 text-center">
                    <p className="text-sm text-red-600 sm:text-base">{error}</p>
                </CardContent>
            </Card>
        </div>
    )
  }


  return (
    <div className="flex h-full w-full justify-center p-2 sm:p-3">
      <Card className="flex h-full w-full max-w-3xl flex-col rounded-lg shadow-lg sm:rounded-2xl">
        {/* Messages */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full px-3 py-4 sm:px-4 sm:py-6">
            <div className="space-y-4 sm:space-y-6">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 sm:gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="h-7 w-7 shrink-0 sm:h-8 sm:w-8">
                      <img src="/chisaAI.png" alt="Assistant Avatar" />
                    </Avatar>
                  )}

                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-xl px-3 py-2 text-xs leading-relaxed sm:max-w-[75%] sm:rounded-2xl sm:px-4 sm:text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.parts.map((Part, index) => Part.type === "text" ? <ReactMarkdown remarkPlugins={[remarkGfm]} key={index}>{Part.text}</ReactMarkdown> : null)}
                  </div>

                  {msg.role === "user" && (
                    <Avatar className="h-7 w-7 shrink-0 sm:h-8 sm:w-8">
                      <AvatarFallback>😎</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>
        </CardContent>

        {/* Input */}
        <div className="border-t p-3 sm:p-4">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Chat với ChisaAI..."
              className="min-h-[44px] resize-none rounded-lg text-sm sm:min-h-[48px] sm:rounded-xl sm:text-base"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessageHandler(input);
                }
              }}
            />
            <Button 
              onClick={() => sendMessageHandler(input)} 
              size="icon" 
              className="h-11 w-11 shrink-0 rounded-lg sm:rounded-xl"
              disabled={status !== 'ready' || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
