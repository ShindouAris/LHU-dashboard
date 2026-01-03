import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Wrench, Send, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthStorage } from '@/types/user';
import { Badge } from './ui/badge';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { LoaderIcon } from '@/components/ui/LoaderIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Avatar } from './ui/avatar';
import rehypeKatex from 'rehype-katex'

const API = import.meta.env.VITE_API_URL;

const ChatbotUI = () => {
  const [inputValue, setInputValue] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const user = AuthStorage.getUser();

  const {messages, sendMessage, status, id} = useChat({
    transport: new DefaultChatTransport({
      api: `${API}/chisaAI/v2/chat`,
      body: {
        access_token: AuthStorage.getUserToken() || ''
      }
    })
  });

  useEffect(() => {
    if (id !== window.location.hash.replace("#", "")) {
        window.location.hash = id;
    }
  }, [id])

  useEffect(() => {
    setError("Trang web chưa hoạt động, quay lại sau nhé!")
  }, [])

  useEffect(() => {
    const load = async () => {
      const user = AuthStorage.getTokenWithAuth();
      if (!user) {
        setError("Phiên đã hết hạn, vui lòng đăng nhập lại");
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleReasoning = (messageId: string) => {
    setExpandedReasoning(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const toggleToolCalls = (messageId: string) => {
    setExpandedToolCalls(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

   const TOOL_NAME_VI_MAP = {
    GETNEXTCLASSTOOL: "Công cụ lấy lớp học tiếp theo",
    GETSTUDENTSCHEDULETOOL: "Công cụ lấy thời khóa biểu sinh viên",
    WEATHERFORECASTTOOL: "Công cụ lấy dự báo thời tiết",
    WEATHERFORECASTDAYTOOL: "Công cụ lấy dự báo thời tiết theo ngày",
    WEATHERCURRENTTOOL: "Công cụ lấy thời tiết hiện tại",
    LMSDIEMDANHTOOL: "Công cụ lấy thông tin điểm danh LMS",
    GETELIBTHONGSOTOOL: "Công cụ lấy thông số eLibrary",
    GETELIBROOMCONFIGURATIONTOOL: "Công cụ lấy cấu hình phòng eLibrary",
    GETELIBUSERBOOKINGLISTTOOL: "Công cụ lấy danh sách đặt phòng eLibrary",
    GETELIBRESERVATIONBYDAYTOOL: "Công cụ lấy đặt phòng eLibrary theo ngày",
    GETELIBPHONGHOCFORREGTOOL: "Công cụ lấy phòng học có thể đăng ký",
    GETELIBTHIETBIFORREGTOOL: "Công cụ lấy thiết bị có thể đăng ký",
} as const;

  const handleSend = () => {
    if (status !== 'ready') return;
    if (!inputValue.trim()) return;
    
    const userMsg = {
      id: crypto.randomUUID().toString(),
      role: 'user',
      text: inputValue
    };
    sendMessage(userMsg);
    setInputValue('');
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-left px-4 py-12">
      <h1 className="text-3xl font-normal mb-3 text-gray-800">
        Xin chào, {user?.FullName || "Người vô danh"}!
      </h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Tôi là Chisa. Một trợ lý được phát triển độc lập bởi đội ngũ LHU dashboard.
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-white">
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
      <div className="flex h-screen w-full items-center justify-center p-4 bg-gradient-to-b from-amber-50 to-white">
        <Card className="w-full max-w-md rounded-2xl shadow-lg">
          <CardContent className="p-6 text-center">
            <img src='bruh.png' className="mx-auto mb-4" />
            <p className="text-sm text-red-600 sm:text-base">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800">ChisaAI V2</h2>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <img src='/chisaAI.png'/>
                  </Avatar>
                )}

                <div className={`flex flex-col gap-2 max-w-[85%]`}>
                  {/* Reasoning Dropdown */}
                  {message.parts.find((part) => part.type === 'reasoning') && (
                    <Card className="border border-blue-200 bg-blue-50/50 overflow-hidden">
                      <button
                        onClick={() => toggleReasoning(message.id)}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-blue-100/50 transition-colors"
                      >
                        {expandedReasoning[message.id] ? (
                          <ChevronDown className="w-4 h-4 text-blue-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-600" />
                        )}
                        <Sparkles className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-700">
                          Suy nghĩ của chisa
                        </span>
                      </button>
                      {expandedReasoning[message.id] && (
                        <div className="px-4 pb-3 pt-1">
                          <p className="text-sm text-blue-900 leading-relaxed text-left">
                            {message.parts.map((part, idx) => 
                            part.type === 'reasoning' ? (
                              <span key={idx}>{part.text}</span>
                            ) : null
                            )}
                          </p>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Tool Calls Dropdown */}
                  {message.parts.find((part) => part.type.startsWith('tool-')) && (
                    <Card className="border border-purple-200 bg-purple-50/50 overflow-hidden">
                      <button
                        onClick={() => toggleToolCalls(message.id)}
                        className="w-full px-4 py-3 flex items-center gap-2 hover:bg-purple-100/50 transition-colors"
                      >
                        {expandedToolCalls[message.id] ? (
                          <ChevronDown className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-purple-600" />
                        )}
                        <Wrench className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">
                          Used {message.parts.filter((part) => part.type.includes('tool')).length} tool{message.parts.filter((part) => part.type.includes('tool')).length > 1 ? 's' : ''}
                        </span>
                      </button>
                      {expandedToolCalls[message.id] && (
                        <div className="px-4 pb-3 pt-1 space-y-3">
                          {message.parts.map((part, idx) => 
                            part.type.startsWith('tool-') ? (
                                <div key={idx} className="text-sm">
                                    <div className="font-medium text-left text-purple-900 mb-1">
                                        Sử dụng {TOOL_NAME_VI_MAP[part.type.replace('tool-', '').toUpperCase() as keyof typeof TOOL_NAME_VI_MAP].toLowerCase() || part.type}
                                    </div>
                                </div>
                            ) : null)}
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Message Content */}
                  <Card
                    className={`px-6 py-3 overflow-auto ${
                      message.role === 'user'
                        ? 'bg-gray-100 border-gray-200'
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="text-gray-800 leading-relaxed text-left">
                      {message.parts.map((Part, index) => 
                        Part.type === "text" ? (
                          <ReactMarkdown
                            key={index}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              table({ children }) {
                                return (
                                  <div className="overflow-x-auto my-4">
                                    <table className="w-full border-collapse text-left">
                                      {children}
                                    </table>
                                  </div>
                                );
                              },
                              thead({ children }) {
                                return <thead className="bg-muted/50">{children}</thead>;
                              },
                              th({ children }) {
                                return (
                                  <th className="px-4 py-2 border font-semibold text-left">
                                    {children}
                                  </th>
                                );
                              },
                              td({ children }) {
                                return (
                                  <td className="px-4 py-2 border align-top">
                                    {children}
                                  </td>
                                );
                              },
                              tr({ children }) {
                                return <tr className="even:bg-muted/20">{children}</tr>;
                              },
                            }}
                          >
                            {Part.text}
                          </ReactMarkdown>
                        ) : null
                      )}
                    </div>
                  </Card>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-gray-700" />
                  </div>
                )}
              </div>
            ))}            <div ref={bottomRef} />          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Chat với ChisaAI..."
            className="flex-1 border-gray-300 focus:border-amber-500 focus:ring-amber-500"
          />
          <Badge>
            Automatic
          </Badge>
          <Button
            onClick={handleSend}
            disabled={status !== 'ready' || !inputValue.trim()}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotUI;