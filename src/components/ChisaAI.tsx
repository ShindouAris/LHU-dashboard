import { memo, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Wrench, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AuthStorage } from '@/types/user';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { LoaderIcon } from '@/components/ui/LoaderIcon';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex'
import "katex/dist/katex.min.css";
import { Avatar } from './ui/avatar';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import remarkMath from 'remark-math'
import {atomDark} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PromptInput, PromptInputSubmit, PromptInputTextarea } from './ai-elements/prompt-input';
import { Construction } from './LHU_UI/Contruction';
const API = import.meta.env.VITE_API_URL;

type EmptyStateProps = {
  fullName?: string;
  inputValue: string;
  status: string;
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
};

const EmptyState = memo(function EmptyState({
  fullName,
  inputValue,
  status,
  onChangeInput,
  onSubmit,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-left px-4 py-12">
      <h1 className="text-3xl font-normal mb-3 text-gray-800 dark:text-yellow-300 font-loveHouse">
        Ciallo, {fullName || 'Người vô danh'}!
      </h1>
      <p className="text-gray-600 dark:text-pink-400 mb-8 max-w-md">
        Tôi là Chisa. Một trợ lý được phát triển độc lập bởi đội ngũ LHU dashboard.
      </p>
      <p className="text-red-600 dark:text-red-400 mb-8 max-w-md">
        Lưu ý: Hệ thống này không lưu lịch sử chat, đổi trang bạn sẽ mất hêt cuộc trò chuyện hiện tại.
      </p>
      {/* Input chat */}
      <div className="w-full max-w-md">
        <PromptInput
          onSubmit={onSubmit}
          className="border border-gray-300 rounded-md px-4 py-2 focus:border-amber-500 focus:ring-amber-500 w-full dark:bg-slate-800 dark:text-gray-100 dark:border-slate-700"
        >
          <PromptInputTextarea
            value={inputValue}
            placeholder="Bắt đầu trò chuyện với ChisaAI..."
            onChange={(e) => onChangeInput(e.target.value)}
          />
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={!inputValue.trim()}
            className="absolute right-4"
          />
        </PromptInput>
      </div>
    </div>
  );
});


const ChatbotUI = () => {
  const [inputValue, setInputValue] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<Record<string, boolean>>({});
  const [expandedToolCalls, setExpandedToolCalls] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [access, setAccess] = useState<boolean>(false);
  const user = AuthStorage.getUser();
  // @ts-ignore
  const {messages, sendMessage, status, id, setMessages} = useChat({
    generateId: () => crypto.randomUUID().toString(),
    transport: new DefaultChatTransport({
      api: `${API}/chisaAI/v2/chat`,
      body: {
        access_token: AuthStorage.getUserToken() || '',
        user_id: user?.UserID || '',
      }
    })
  });

  useEffect(() => {
    if (id !== window.location.hash.replace("#", "")) {
        window.location.hash = id;
    }
  }, [id])

  useEffect(() => {
    setAccess(true)
  }, [])

  useEffect(() => {
    const load = async () => {
      const user = AuthStorage.getTokenWithAuth();
      if (!user) {
        setError("Phiên đã hết hạn, vui lòng đăng nhập lại");
      }
      setTimeout(() => {
        setLoading(false);
      })
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

  if (!access) {
    return (
      <Construction />
    );
  }

  return (
    <div className="flex flex-col min-h-[87vh] max-h-[87vh] rounded-sm">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState
            fullName={user?.FullName}
            inputValue={inputValue}
            status={status}
            onChangeInput={setInputValue}
            onSubmit={handleSend}
          />
        ) : (
          <div className="max-w-screen-md sm:max-w-7xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden dark:from-amber-600 dark:to-orange-700">
                    <img src='/chisaAI.png' alt="Chisa" className="w-full h-full object-cover" />
                  </Avatar>
                )}

                <div className="flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] min-w-0">
                  {/* Reasoning Dropdown */}
                  {message.parts.find((part) => part.type === 'reasoning') && (
                    <Card className="border border-blue-200 bg-blue-50/50 overflow-hidden dark:border-blue-800 dark:bg-blue-900/20">
                      <button
                        onClick={() => toggleReasoning(message.id)}
                        className="w-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:bg-blue-100/50 transition-colors text-sm sm:text-base"
                      >
                        {expandedReasoning[message.id] ? (
                          <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        )}
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-200">
                          Suy nghĩ của chisa
                        </span>
                      </button>
                      {expandedReasoning[message.id] && (
                        <div className="px-3 sm:px-4 pb-3 pt-1">
                          <p className="text-sm text-blue-900 leading-relaxed text-left break-words whitespace-pre-wrap dark:text-blue-200">
                            {message.parts.map((part, idx) =>
                              part.type === 'reasoning' ? (
                                <span key={`${message.id}-reasoning-${idx}`}>{part.text}</span>
                              ) : null
                            )}
                          </p>
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Tool Calls Dropdown */}
                  {message.parts.find((part) => part.type.startsWith('tool-')) && (
                    <Card className="border border-purple-200 bg-purple-50/50 overflow-hidden dark:border-purple-800 dark:bg-purple-900/20">
                      <button
                        onClick={() => toggleToolCalls(message.id)}
                        className="w-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:bg-purple-100/50 transition-colors text-sm sm:text-base"
                      >
                        {expandedToolCalls[message.id] ? (
                          <ChevronDown className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        )}
                        <Wrench className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-200">
                          Used {message.parts.filter((part) => part.type.includes('tool')).length} tool{message.parts.filter((part) => part.type.includes('tool')).length > 1 ? 's' : ''}
                        </span>
                      </button>
                      {expandedToolCalls[message.id] && (
                        <div className="px-3 sm:px-4 pb-3 pt-1 space-y-3 text-sm">
                          {message.parts.map((part, idx) =>
                            part.type.startsWith('tool-') ? (
                              <div key={`${message.id}-tool-${idx}`} className="text-sm">
                                <div className="font-medium text-left text-purple-900 mb-1 break-words dark:text-purple-200">
                                  Sử dụng {TOOL_NAME_VI_MAP[part.type.replace('tool-', '').toUpperCase() as keyof typeof TOOL_NAME_VI_MAP]?.toLowerCase() || part.type}
                                </div>
                              </div>
                            ) : null)}
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Message Content */}
                  <div
                    className={`px-4 py-3 overflow-auto rounded-md border ${message.role === 'user' ? 'bg-gray-100 border-gray-200 self-end dark:bg-gray-800 dark:border-slate-700' : 'bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700'}`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    <div className="text-gray-800 leading-relaxed text-left break-words whitespace-pre-wrap dark:text-gray-100">
                      {message.parts.map((Part, index) =>
                        Part.type === "text" ? (
                          <ReactMarkdown
                            key={`${message.id}-text-${index}`}
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[rehypeKatex]} 
                            components={{
                              pre({ children }) {
                                return <pre className="bg-muted p-2 rounded overflow-auto dark:bg-muted/20">{children}</pre>;
                              },
                              code( props ) {
                                const {children, className, node, ...rest} = props
                                const match = /language-(\w+)/.exec(className || '')
                                const [copied, setCopied] = useState(false);

                                const handleCopy = () => {
                                  const code = String(children).replace(/\n$/, '');
                                  navigator.clipboard.writeText(code);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 1500);
                                }
                                return match ? (
                                  <div className='relative group'>
                                    <SyntaxHighlighter
                                    PreTag="div"
                                    children={String(children).replace(/\n$/, '')}
                                    language={match[1]}
                                    style={atomDark}
                                  />
                                        <span className="absolute right-2 top-2 text-xs text-white z-10 flex items-center gap-2">
                                        {match[1]}
                                        <button
                                          className="ml-2 px-2 py-0.5 rounded text-xs bg-purple-600 hover:bg-purple-700 transition-colors opacity-80 hover:opacity-100"
                                          onClick={handleCopy}
                                          type="button"
                                        >
                                          {copied ? "✓ Đã sao chép!" : "Sao chép"}
                                        </button>
                                      </span>

                                  </div>
                                  
                                ) : (
                                  <code {...rest} className={className}>
                                    {children}
                                  </code>
                                )
                              },                              
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
                                return <thead className="bg-muted/50 dark:bg-muted/20">{children}</thead>;
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
                                return <tr className="even:bg-muted/20 dark:even:bg-muted/10">{children}</tr>;
                              },
                            }}
                          >
                            {Part.text}
                          </ReactMarkdown>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1 dark:bg-gray-600">
                    <User className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                )}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-white px-3 sm:px-4 py-3 sm:py-4 dark:bg-slate-900 dark:border-slate-700">
              <div className={`max-w-screen-md sm:max-w-3xl mx-auto flex gap-2 items-center` + (messages.length === 0 ? ' hidden' : '')}>
                <PromptInput
                  onSubmit={handleSend}
                  className="flex-1 border-gray-300 focus:border-amber-500 focus:ring-amber-500 min-w-0 dark:bg-slate-800 dark:text-gray-100 dark:border-slate-700"
                >
                
                <PromptInputTextarea
                  value={inputValue}
                  placeholder="Chat với ChisaAI..."
                  onChange={(e) => setInputValue(e.target.value)}
                />
                <PromptInputSubmit
                  status={status === 'streaming' ? 'streaming' : 'ready'}
                  disabled={!inputValue.trim()}
                  className='absolute right-4'
                  />
                </PromptInput>
              </div>
              {/* Footer */}
              <div className="text-center text-xs text-gray-500 mt-2">
                <span>AI có thể sai, kiểm chứng trước khi sử dụng. Hỏi toán hơi ngu vì AI render latex không tốt lắm.</span>
              </div>
            </div>
    </div>
  );
};

export default ChatbotUI;