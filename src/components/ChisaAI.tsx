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
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkBreak from 'remark-breaks'
import "katex/dist/katex.min.css";
import { Avatar } from './ui/avatar';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import remarkMath from 'remark-math'
import {atomDark} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PromptInput, PromptInputSubmit, PromptInputTextarea } from './ai-elements/prompt-input';
import { Construction } from './LHU_UI/Contruction';
import { chisaAIStorage, type ChisaAIChatSummary } from '@/services/chisaAIStorage';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VscDebugRestart } from "react-icons/vsc";
import { Table, TableCell, TableHead, TableRow } from './ui/table';
const API = import.meta.env.VITE_API_URL;

const katexSanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    div: [
      ...(defaultSchema.attributes?.div || []),
      ['className'],
      ['style'],
      ['aria-hidden'],
      ['aria-label'],
      ['role'],
    ],
    span: [
      ...(defaultSchema.attributes?.span || []),
      ['className'],
      ['style'],
      ['aria-hidden'],
      ['aria-label'],
      ['role'],
    ],
    code: [
      ...(defaultSchema.attributes?.code || []),
      ['className'],
    ],
    pre: [
      ...(defaultSchema.attributes?.pre || []),
      ['className'],
    ],
  },
} as const;

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
      <h1 className="text-3xl font-normal mb-3 text-pink-600 dark:text-yellow-300 font-loveHouse">
      Ciallo, {fullName || 'Người vô danh'}!
      </h1>
      <p className="text-gray-600 dark:text-pink-400 mb-8 max-w-md">
      Tôi là Chisa. Một trợ lý được phát triển độc lập bởi đội ngũ LHU dashboard.
      </p>
      <p className="text-red-600 dark:text-red-400 mb-8 max-w-md">
      Lưu ý: Lịch sử chat được lưu trên chính thiết bị của bạn (IndexedDB). Xóa dữ liệu trình duyệt sẽ mất lịch sử.
      </p>

      {/* Input chat */}
      <div className="w-full max-w-md">
      <PromptInput onSubmit={onSubmit} className="relative rounded-md px-4 py-2">
        <PromptInputTextarea
        value={inputValue}
        placeholder="Bắt đầu trò chuyện với ChisaAI..."
        className="border rounded-md border-pink-300 dark:border-pink-400 pr-16"
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
  const [chatSwitchLoading, setChatSwitchLoading] = useState<boolean>(false);
  const [chatSwitchLabel, setChatSwitchLabel] = useState<string>('Đang tạo phiên chat...');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollRafRef = useRef<number | null>(null);
  const [access, setAccess] = useState<boolean>(false);
  const user = AuthStorage.getUser();

  const initialHashRef = useRef<string>(window.location.hash.replace('#', '').trim());
  const hadInitialHashRef = useRef<boolean>(!!initialHashRef.current);
  const startedRef = useRef<boolean>(false);

  const [chatId, setChatId] = useState(() => {
    return initialHashRef.current || crypto.randomUUID().toString();
  });

  const [chatSummaries, setChatSummaries] = useState<ChisaAIChatSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  const didHydrateRef = useRef(false);
  const persistTimerRef = useRef<number | null>(null);

  // @ts-ignore
  const {messages, sendMessage, status, id, setMessages, regenerate} = useChat({
    id: chatId,
    generateId: () => crypto.randomUUID().toString(),
    transport: new DefaultChatTransport({
      api: `${API}/chisaAI/v2/chat`,
      body: {
        access_token: AuthStorage.getUserToken() || '',
        user_id: user?.UserID || '',
      }
    }),
    onError: (err) => {
      setError(err.message || 'Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ.');
    },
  });

  useEffect(() => {
    // Don't force-create a URL hash for a brand new, empty chat.
    // Only keep hash in sync if user came with a hash, or chat has started.
    if (!hadInitialHashRef.current && !startedRef.current) return;
    if (id !== window.location.hash.replace('#', '')) {
      window.location.hash = id;
    }
  }, [id]);

  useEffect(() => {
    const onHashChange = () => {
      const next = window.location.hash.replace('#', '').trim();
      if (!next) return;
      if (next !== chatId) {
        setChatId(next);
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [chatId]);

  useEffect(() => {
    // Ensure switching chats re-hydrates from IndexedDB.
    didHydrateRef.current = false;
  }, [id, user?.UserID]);

  useEffect(() => {
    const refreshHistory = async () => {
      const userId = user?.UserID;
      if (!userId) return;
      setHistoryLoading(true);
      try {
        const list = await chisaAIStorage.listByUser(userId, 30);
        setChatSummaries(list);
      } finally {
        setHistoryLoading(false);
      }
    };

    refreshHistory();
  }, [user?.UserID]);

  useEffect(() => {
    const hydrate = async () => {
      if (didHydrateRef.current) return;
      const userId = user?.UserID;
      if (!userId || !id) return;

      const record = await chisaAIStorage.get(userId, id);
      if (record?.messages && Array.isArray(record.messages) && record.messages.length > 0) {
        // @ts-ignore runtime shape matches the UI messages from useChat
        setMessages(record.messages);
      }
      didHydrateRef.current = true;
      setChatSwitchLoading(false);
    };

    hydrate();
  }, [user?.UserID, id, setMessages]);

  useEffect(() => {
    const userId = user?.UserID;
    if (!userId || !id) return;

    // Do not persist empty chats.
    if (!messages || messages.length === 0) {
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    // Debounce writes to IndexedDB while streaming
    persistTimerRef.current = window.setTimeout(() => {
      (async () => {
        await chisaAIStorage.set(userId, id, messages as unknown[]);
        await chisaAIStorage.pruneUserChats(userId, 30);
        const list = await chisaAIStorage.listByUser(userId, 30);
        setChatSummaries(list);
      })();
    }, 250);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [messages, user?.UserID, id]);

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleString('vi-VN', {
      hour12: false,
      year: '2-digit',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const beginChatSwitch = (label: string) => {
    setChatSwitchLabel(label);
    setChatSwitchLoading(true);
    setExpandedReasoning({});
    setExpandedToolCalls({});
    setInputValue('');
    // Clear current messages immediately so the UI doesn't flash old chat content.
    // @ts-ignore runtime shape matches the UI messages from useChat
    setMessages([]);
    didHydrateRef.current = false;
  };

  const startNewChat = () => {
    beginChatSwitch('Đang tạo phiên chat...');
    const newId = crypto.randomUUID().toString();
    setChatId(newId);
    window.location.hash = newId;
  };

  const openChat = (targetChatId: string) => {
    if (!targetChatId) return;
    beginChatSwitch('Đang mở phiên chat...');
    setChatId(targetChatId);
    window.location.hash = targetChatId;
  };

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
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const thresholdPx = 80;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < thresholdPx;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    if (pendingScrollRafRef.current) return;

    const isStreaming = status === 'streaming';

    pendingScrollRafRef.current = window.requestAnimationFrame(() => {
      pendingScrollRafRef.current = null;
      bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
    });
  }, [messages, status]);

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

  const isGenerating = status === 'streaming';
  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

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

    startedRef.current = true;
    // If user didn't start with a hash, create it only when they send the first message.
    if (!hadInitialHashRef.current && !window.location.hash) {
      window.location.hash = id;
    }
    
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
      <div className="px-3 sm:px-4 py-2">
        <div className="max-w-screen-md sm:max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400">Phiên chat</div>
            <div className="text-sm font-medium truncate text-gray-800 dark:text-gray-100">
              {id ? id.slice(0, 10) : '...'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startNewChat} disabled={chatSwitchLoading || isGenerating}>
              Chat mới
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={historyLoading || chatSwitchLoading || isGenerating}>
                  {historyLoading ? 'Đang tải…' : 'Lịch sử'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 max-h-[60vh] overflow-auto">
                <DropdownMenuLabel>Đoạn chat đã lưu trên thiết bị</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {chatSummaries.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Chưa có lịch sử.
                  </div>
                ) : (
                  chatSummaries.map((c) => (
                    <DropdownMenuItem
                      key={c.chatId}
                      onSelect={(e) => {
                        e.preventDefault();
                        openChat(c.chatId);
                      }}
                      className={
                        c.chatId === id
                          ? 'bg-accent text-accent-foreground'
                          : undefined
                      }
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {c.chatId.slice(0, 12)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {c.messageCount} tin • {formatTime(c.updatedAt)}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    startNewChat();
                  }}
                >
                  Tạo chat mới
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto px-4 py-6">
        {chatSwitchLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 backdrop-blur-sm dark:bg-slate-950/60">
            <Card className="w-full max-w-sm rounded-2xl shadow-lg">
              <CardContent className="p-6 text-center">
                <LoaderIcon />
                <p className="mt-2 text-sm sm:text-base text-gray-700 dark:text-gray-200">{chatSwitchLabel}</p>
              </CardContent>
            </Card>
          </div>
        )}
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
                          <p className="text-sm text-blue-900 leading-relaxed text-left break-words dark:text-blue-200">
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
                    <div className="text-gray-800 leading-relaxed text-left break-words dark:text-gray-100">
                      {message.parts.map((Part, index) =>
                        Part.type === "text" ? (
                          (isGenerating && message.role === 'assistant' && message.id === lastMessageId) ? (
                            <div key={`${message.id}-streaming-${index}`} className="break-words">
                              {Part.text}
                            </div>
                          ) : (
                            <ReactMarkdown
                              key={`${message.id}-text-${index}`}
                              remarkPlugins={[remarkGfm, remarkMath, remarkBreak]}
                              rehypePlugins={[
                                rehypeRaw,
                                [rehypeKatex, { output: 'html' }],
                                [rehypeSanitize, katexSanitizeSchema],
                              ]}
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
                                      <Table className="w-full">
                                        {children}
                                      </Table>
                                  );
                                },
                                thead({ children }) {
                                  return <thead className="bg-muted/50 dark:bg-muted/20">{children}</thead>;
                                },
                                th({ children }) {
                                  return (
                                    <TableHead className="px-4 py-2 border font-semibold text-left bg-purple-400 dark:bg-green-600 text-black dark:text-white">
                                      {children}
                                    </TableHead>
                                  );
                                },
                                td({ children }) {
                                  return (
                                    <TableCell className="px-4 py-2 border align-top">
                                      {children}
                                    </TableCell>
                                  );
                                },
                                tr({ children }) {
                                  return <TableRow className="bg-pink-300 dark:bg-sky-600 text-black dark:text-white">{children}</TableRow>;
                                },
                              }}
                            >
                              {Part.text}
                            </ReactMarkdown>
                          )
                          
                        ) : null
                      )}
                    </div>
                  </div>
                  {message.role === 'assistant' && status === 'ready' && (
                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => regenerate()}
                      >
                        <VscDebugRestart className="w-7 h-7 text-gray-500" />
                      </Button>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 mt-1 dark:bg-gray-600">
                    <User className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                  </div>
                )}
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3 sm:gap-4 items-start justify-start">
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 mt-1 overflow-hidden dark:from-amber-600 dark:to-orange-700">
                  <img src='/chisaAI.png' alt="Chisa" className="w-full h-full object-cover" />
                </Avatar>
                <div className="px-4 py-3 rounded-md border bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <LoaderIcon className="w-4 h-4" />
                    <span>Chisa đang trả lời…</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="px-3 sm:px-4 py-3 sm:py-4">
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
                  status={status}
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