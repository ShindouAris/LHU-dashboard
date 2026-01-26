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
import remarkToc from 'remark-toc'
import "katex/dist/katex.min.css";
import { Avatar } from './ui/avatar';
import {Prism as SyntaxHighlighter} from 'react-syntax-highlighter'
import remarkMath from 'remark-math'
import {atomDark} from 'react-syntax-highlighter/dist/esm/styles/prism'
import { PromptInput, PromptInputSubmit, PromptInputTextarea } from './ai-elements/prompt-input';
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
} from './ai-elements/model-selector';
import { NotAvailable } from './LHU_UI/Contruction';
import { chisaAIService } from '@/services/chisaAIService';
import type { IModel } from '@/types/chisaAI';
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
import GradientText from './ui/GradientText';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
const API = import.meta.env.VITE_API_URL;

type ChisaAIChatSummary = {
  chatId: string;
  userId: string;
  timestamp: number;
  updatedAt: number;
  messageCount: number;
};

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
  models: IModel[];
  selectedModel: string;
  modelsLoading: boolean;
  isModelSelectorOpen: boolean;
  onModelChange: (modelId: string) => void;
  onModelSelectorOpenChange: (open: boolean) => void;
  isGenerating: boolean;
};

const EmptyState = memo(function EmptyState({
  fullName,
  inputValue,
  status,
  onChangeInput,
  onSubmit,
  models,
  selectedModel,
  modelsLoading,
  isModelSelectorOpen,
  onModelChange,
  onModelSelectorOpenChange,
  isGenerating,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <GradientText className="text-2xl font-normal mb-3 font-loveHouse" colors={["#ffdcff", "#A8DF8E", "#1581BF"]} yoyo={false} animationSpeed={0.8}>
      Ciallo, {fullName || 'Người vô danh'}!
      </GradientText>
      <p className="text-gray-600 dark:text-pink-400 backdrop-blur-sm mb-8 max-w-md">
      Em là Chisa. Một trợ lý được phát triển độc lập bởi đội ngũ LHU dashboard.
      </p>

      {/* Model Selector */}
      <div className="w-full max-w-md mb-4">
        <ModelSelector open={isModelSelectorOpen} onOpenChange={onModelSelectorOpenChange}>
          <ModelSelectorTrigger asChild>
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isGenerating || modelsLoading}
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">
                {modelsLoading ? 'Đang tải models...' : (models.find(m => m.modelId === selectedModel)?.safeName || 'Chọn model')}
              </span>
            </Button>
          </ModelSelectorTrigger>
          <ModelSelectorContent>
            <ModelSelectorInput placeholder="Tìm model..." />
            <ModelSelectorList>
              <ModelSelectorEmpty>
                {modelsLoading ? 'Đang tải models...' : 'Không tìm thấy model.'}
              </ModelSelectorEmpty>
              {!modelsLoading && (() => {
                const groupedModels = models.reduce((acc, model) => {
                  const provider = model.modelId.split('/')[0];
                  if (!acc[provider]) acc[provider] = [];
                  acc[provider].push(model);
                  return acc;
                }, {} as Record<string, IModel[]>);

                const providerNames: Record<string, string> = {
                  'openai': 'OpenAI',
                  'anthropic': 'Anthropic',
                  'google': 'Google',
                  'deepseek': 'DeepSeek',
                  'meta-llama': 'Meta',
                  'mistral': 'Mistral',
                  'perplexity': 'Perplexity',
                };

                return Object.entries(groupedModels).map(([provider, providerModels]) => (
                  <ModelSelectorGroup key={provider} heading={providerNames[provider] || provider}>
                    {providerModels.map((model) => (
                      <ModelSelectorItem
                        key={model.modelId}
                        value={model.safeName}
                        onSelect={() => {
                          onModelChange(model.safeName);
                          onModelSelectorOpenChange(false);
                        }}
                      >
                        <ModelSelectorLogoGroup>
                          <ModelSelectorLogo provider={provider} />
                        </ModelSelectorLogoGroup>
                        <ModelSelectorName>{model.safeName}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                ));
              })()}
            </ModelSelectorList>
          </ModelSelectorContent>
        </ModelSelector>
      </div>

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

const Message = memo(({message, index, Part}: {message: any, index: number, Part: any}) => {
  return (
    <ReactMarkdown key={`${message.id}-streaming-${index}`} 
      remarkPlugins={[remarkGfm, remarkMath, remarkBreak, remarkToc]}
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
            <TableHead className="px-4 py-2 border font-semibold  bg-purple-400 dark:bg-green-600 text-black dark:text-white">
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
        h2: ({ children }) => (
          <h2 className="mt-8 mb-4 text-2xl font-bold tracking-tight border-b pb-2">
            {children}
          </h2>
        ),
        ul: ({ children }) => (
          <ul className="my-4 ml-6 space-y-2 list-disc">
            {children}
          </ul>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">
            {children}
          </li>
        ),
        
      }} skipHtml={true}>
      {Part.text}
    </ReactMarkdown>
  )
}, (prevProps, nextProps) => {
  return prevProps.Part.text === nextProps.Part.text && prevProps.message.id === nextProps.message.id;
})


const ChatbotUI = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelSelectorOpen, setIsModelSelectorOpen] = useState(false);
  const [models, setModels] = useState<IModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
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
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [showTermsDialog, setShowTermsDialog] = useState<boolean>(false);
  const [isCreatingUser, setIsCreatingUser] = useState<boolean>(false);
  const user = AuthStorage.getUser();

  const initialHashRef = useRef<string>(window.location.hash.replace('#', '').trim());
  const hadInitialHashRef = useRef<boolean>(!!initialHashRef.current);
  const startedRef = useRef<boolean>(false);

  const [chatId, setChatId] = useState(() => {
    return initialHashRef.current || crypto.randomUUID().toString();
  });

  const [chatSummaries, setChatSummaries] = useState<ChisaAIChatSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [chatListNextToken, setChatListNextToken] = useState<string | null>(null);
  const [chatHistoryNextToken, setChatHistoryNextToken] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

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
        model: selectedModel,
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
      const token = AuthStorage.getUserToken();
      if (!userId || !token) return;
      setHistoryLoading(true);
      try {
        const response = await chisaAIService.getChatList(token, null);
        // Convert API response to ChisaAIChatSummary format
        const summaries: ChisaAIChatSummary[] = response.chats.map(chat => ({
          chatId: chat.chatUUID,
          userId: userId,
          timestamp: new Date(chat.updatedAt).getTime(),
          updatedAt: new Date(chat.updatedAt).getTime(),
          messageCount: chat.messageCount
        }));
        setChatSummaries(summaries);
        setChatListNextToken(response.next_token);
      } catch (error) {
        console.error('Failed to load chat list:', error);
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
      const token = AuthStorage.getUserToken();
      if (!userId || !id || !token) return;

      try {
        const history = await chisaAIService.getChatHistory(token, id, null);
        if (history?.messages && Array.isArray(history.messages) && history.messages.length > 0) {
          // @ts-ignore runtime shape matches the UI messages from useChat
          setMessages(history.messages);
          setChatHistoryNextToken(history.next_token);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
        // If chat doesn't exist on server yet, that's okay - it's a new chat
      }
      didHydrateRef.current = true;
      setChatSwitchLoading(false);
    };

    hydrate();
  }, [user?.UserID, id, setMessages]);

  useEffect(() => {
    const userId = user?.UserID;
    const token = AuthStorage.getUserToken();
    if (!userId || !id || !token) return;

    // Do not refresh for empty chats.
    if (!messages || messages.length === 0) {
      return;
    }

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    // Debounce chat list refresh while streaming
    persistTimerRef.current = window.setTimeout(() => {
      (async () => {
        try {
          const response = await chisaAIService.getChatList(token, null);
          const summaries: ChisaAIChatSummary[] = response.chats.map(chat => ({
            chatId: chat.chatUUID,
            userId: userId,
            timestamp: new Date(chat.updatedAt).getTime(),
            updatedAt: new Date(chat.updatedAt).getTime(),
            messageCount: chat.messageCount
          }));
          setChatSummaries(summaries);
          setChatListNextToken(response.next_token);
        } catch (error) {
          console.error('Failed to refresh chat list:', error);
        }
      })();
    }, 2000);

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

  const loadMoreChats = async () => {
    if (!chatListNextToken || isLoadingMore) return;
    
    const token = AuthStorage.getUserToken();
    const userId = user?.UserID;
    if (!token || !userId) return;

    setIsLoadingMore(true);
    try {
      const response = await chisaAIService.getChatList(token, chatListNextToken);
      const newSummaries: ChisaAIChatSummary[] = response.chats.map(chat => ({
        chatId: chat.chatUUID,
        userId: userId,
        timestamp: new Date(chat.updatedAt).getTime(),
        updatedAt: new Date(chat.updatedAt).getTime(),
        messageCount: chat.messageCount
      }));
      setChatSummaries(prev => [...prev, ...newSummaries]);
      setChatListNextToken(response.next_token);
    } catch (error) {
      console.error('Failed to load more chats:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!chatHistoryNextToken || isLoadingMore || !id) return;
    
    const token = AuthStorage.getUserToken();
    if (!token) return;

    setIsLoadingMore(true);
    try {
      const history = await chisaAIService.getChatHistory(token, id, chatHistoryNextToken);
      if (history?.messages && Array.isArray(history.messages) && history.messages.length > 0) {
        // @ts-ignore
        setMessages(prev => [...history.messages, ...prev]);
        setChatHistoryNextToken(history.next_token);
      }
    } catch (error) {
      console.error('Failed to load more messages:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const beginChatSwitch = (label: string) => {
    setChatSwitchLabel(label);
    setChatSwitchLoading(true);
    setExpandedReasoning({});
    setExpandedToolCalls({});
    setInputValue('');
    setChatHistoryNextToken(null);
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

  const handleAgreeToTerms = async () => {
    const token = AuthStorage.getUserToken();
    if (!token) {
      setError("Phiên đã hết hạn, vui lòng đăng nhập lại");
      return;
    }

    setIsCreatingUser(true);
    try {
      await chisaAIService.createUserV3(token);
      setUserExists(true);
      setShowTermsDialog(false);
      setAccess(true);
    } catch (error: any) {
      console.error('Failed to create user:', error);
      setError(error.message || "Không thể tạo tài khoản ChisaAI");
    } finally {
      setIsCreatingUser(false);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      const token = AuthStorage.getUserToken();
      if (!token) {
        setError("Phiên đã hết hạn, vui lòng đăng nhập lại");
        setUserExists(false);
        return;
      }

      try {
        const exists = await chisaAIService.checkUserV3(token);
        setUserExists(exists);
        
        if (exists) {
          setAccess(true);
        } else {
          setShowTermsDialog(true);
        }
      } catch (error) {
        console.error('Failed to check user:', error);
        setError("Không thể kiểm tra trạng thái người dùng");
      }
    };

    checkUser();
  }, [])

  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      try {
        const response = await chisaAIService.getModels();
        setModels(response.models);
        // Set default model
        const defaultModel = response.models.find(m => m.isDefault);
        if (defaultModel) {
          setSelectedModel(defaultModel.safeName);
        } else if (response.models.length > 0) {
          setSelectedModel(response.models[0].safeName);
        }
      } catch (error) {
        console.error('Failed to fetch models:', error);
        // Set fallback model
        setModels([{
          safeName: 'ChisaAI Mini',
          modelId: 'openai/gpt-4o-mini',
          isDefault: true
        }]);
        setSelectedModel('ChisaAI Mini');
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
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
    if (pendingScrollRafRef.current) return;

    const isStreaming = status === 'streaming';

    pendingScrollRafRef.current = window.requestAnimationFrame(() => {
      pendingScrollRafRef.current = null;
      
      // Kiểm tra lại xem user có đang ở dưới cùng không
      const el = scrollContainerRef.current;
      if (!el) return;
      
      const thresholdPx = 80;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < thresholdPx;
      
      // Chỉ scroll nếu user đang ở gần dưới cùng
      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: isStreaming ? 'auto' : 'smooth' });
      }
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
    SEARCHWEBTOOL: "Công cụ tìm kiếm web",
    EXTRACTWEBTOOL: "Công cụ trích xuất nội dung web",
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

  if (loading || userExists === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-lg">
          <CardContent className="p-6 text-center">
            <LoaderIcon />
            <p className="text-sm sm:text-base">
              {userExists === null ? 'Đang kiểm tra trạng thái tài khoản...' : 'Đang kiểm tra kết nối đến máy chủ...'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
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
      <>
        <Dialog open={showTermsDialog} onOpenChange={(open) => !isCreatingUser && setShowTermsDialog(open)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Điều khoản sử dụng ChisaAI</DialogTitle>
              <DialogDescription>
                Vui lòng đọc và đồng ý với các điều khoản dưới đây để sử dụng ChisaAI
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <section>
                <h3 className="font-semibold text-lg mb-2">1. Giới thiệu</h3>
                <p className="text-sm text-muted-foreground">
                  ChisaAI là trợ lý AI được phát triển độc lập bởi đội ngũ LHU Dashboard nhằm hỗ trợ sinh viên 
                  trong việc tra cứu thông tin, quản lý thời khóa biểu và các tiện ích học tập khác.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">2. Thu thập và sử dụng dữ liệu</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Khi sử dụng ChisaAI, chúng tôi sẽ thu thập và lưu trữ:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Lịch sử trò chuyện của bạn với ChisaAI</li>
                  <li>Thông tin tài khoản cơ bản (UserID, tên)</li>
                  <li>Các truy vấn và yêu cầu của bạn</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  Dữ liệu này được sử dụng để cải thiện chất lượng dịch vụ và cá nhân hóa trải nghiệm của bạn.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">3. Bảo mật thông tin</h3>
                <p className="text-sm text-muted-foreground">
                  Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn. Dữ liệu được mã hóa và lưu trữ an toàn. 
                  Chúng tôi không chia sẻ thông tin của bạn với bên thứ ba mà không có sự đồng ý.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">4. Trách nhiệm người dùng</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Không sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                  <li>Không cố gắng phá hoại hoặc xâm nhập hệ thống</li>
                  <li>Không chia sẻ thông tin đăng nhập của bạn</li>
                  <li>Thông tin từ AI có thể không chính xác 100%, hãy xác minh trước khi sử dụng</li>
                </ul>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">5. Giới hạn trách nhiệm</h3>
                <p className="text-sm text-muted-foreground">
                  ChisaAI được cung cấp "nguyên trạng". Chúng tôi không đảm bảo rằng dịch vụ sẽ hoạt động liên tục 
                  và không có lỗi. Chúng tôi không chịu trách nhiệm cho bất kỳ thiệt hại nào phát sinh từ việc sử dụng dịch vụ.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">6. Thay đổi điều khoản</h3>
                <p className="text-sm text-muted-foreground">
                  Chúng tôi có quyền thay đổi các điều khoản này bất kỳ lúc nào. Việc tiếp tục sử dụng dịch vụ 
                  sau khi có thay đổi đồng nghĩa với việc bạn chấp nhận các điều khoản mới.
                </p>
              </section>

              <section>
                <h3 className="font-semibold text-lg mb-2">7. Liên hệ</h3>
                <p className="text-sm text-muted-foreground">
                  Nếu bạn có bất kỳ câu hỏi nào về điều khoản này, vui lòng liên hệ với đội ngũ phát triển qua các kênh hỗ trợ.
                </p>
              </section>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTermsDialog(false)}
                disabled={isCreatingUser}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                onClick={handleAgreeToTerms}
                disabled={isCreatingUser}
                className="w-full sm:w-auto"
              >
                {isCreatingUser ? (
                  <>
                    <LoaderIcon className="mr-2" />
                    Đang xử lý...
                  </>
                ) : (
                  "Đồng ý và tiếp tục"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {!showTermsDialog && <NotAvailable page_name="ChisaAI" />}
      </>
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
                <DropdownMenuLabel>Đoạn chat trước</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {chatSummaries.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
                    Chưa có lịch sử.
                  </div>
                ) : (
                  <>
                    {chatSummaries.map((c) => (
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
                    ))}
                    {chatListNextToken && (
                      <DropdownMenuItem
                        onSelect={(e) => {
                          e.preventDefault();
                          loadMoreChats();
                        }}
                        disabled={isLoadingMore}
                        className="justify-center text-sm text-blue-600 dark:text-blue-400"
                      >
                        {isLoadingMore ? 'Đang tải...' : 'Tải thêm chat'}
                      </DropdownMenuItem>
                    )}
                  </>
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
            models={models}
            selectedModel={selectedModel}
            modelsLoading={modelsLoading}
            isModelSelectorOpen={isModelSelectorOpen}
            onModelChange={setSelectedModel}
            onModelSelectorOpenChange={setIsModelSelectorOpen}
            isGenerating={isGenerating}
          />
        ) : (
          <div className="max-w-screen-md sm:max-w-7xl mx-auto space-y-6">
            {chatHistoryNextToken && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore}
                  className="text-xs sm:text-sm"
                >
                  {isLoadingMore ? 'Đang tải...' : 'Tải tin nhắn cũ hơn'}
                </Button>
              </div>
            )}
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 sm:gap-4 items-start ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 items-center justify-center flex-shrink-0 mt-1 overflow-hidden hidden lg:flex dark:from-amber-600 dark:to-orange-700">
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
                          <p className="text-sm text-blue-900 leading-relaxed  break-words dark:text-blue-200">
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
                              <div key={idx}>

                                {// @ts-expect-error "This work btw"
                                part.state === 'output-available' && (
                                  <div>
                                    Sử dụng công cụ {' '}
                                    {TOOL_NAME_VI_MAP[part.type.replace('tool-', '').toUpperCase() as keyof typeof TOOL_NAME_VI_MAP]?.toLowerCase() ||
                                      part.type}
                                    <pre>{/* @ts-expect-error "This work btw" */
                                    JSON.stringify(part.output, null, 2)}</pre>
                                  </div>
                                )}
                                
                                {// @ts-expect-error "This work btw"
                                part.state === 'output-error' && (
                                  <div>
                                    Lỗi: {// @ts-expect-error "This work btw"
                                      part.errorText
                                    }
                                  </div>
                                )}
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </Card>
                  )}

                  {/* Message Content */}
                  <div
                    className={`px-4 py-3 overflow-auto rounded-md  ${message.role === 'user' ? 'bg-gray-100 backdrop-blur-sm border border-pink-300 self-end dark:bg-gray-800 dark:border-pink-400' : ''}`} 
                    style={{ wordBreak: 'break-word' }}
                  >
                    <div className="text-gray-800 leading-relaxed  break-words dark:text-gray-100">
                      {message.parts.map((Part, index) =>
                        Part.type === "text" ? (
                          <Message key={index} message={message} index={index} Part={Part} />
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-300 hidden lg:flex items-center justify-center flex-shrink-0 mt-1 dark:bg-gray-600">
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
      <div className="px-3 sm:px-4 py-3 sm:py-4">
              <div className={`max-w-screen-md sm:max-w-3xl mx-auto flex gap-2 items-center` + (messages.length === 0 ? ' hidden' : '')}>
                <ModelSelector open={isModelSelectorOpen} onOpenChange={setIsModelSelectorOpen}>
                  <ModelSelectorTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-shrink-0 gap-2 px-3"
                      disabled={isGenerating || modelsLoading}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">
                        {modelsLoading ? 'Đang tải...' : (models.find(m => m.modelId === selectedModel)?.safeName || selectedModel)}
                      </span>
                    </Button>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Tìm model..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>
                        {modelsLoading ? 'Đang tải models...' : 'Không tìm thấy model.'}
                      </ModelSelectorEmpty>
                      {!modelsLoading && (() => {
                        // Group models by provider
                        const groupedModels = models.reduce((acc, model) => {
                          const provider = model.modelId.split('/')[0];
                          if (!acc[provider]) acc[provider] = [];
                          acc[provider].push(model);
                          return acc;
                        }, {} as Record<string, IModel[]>);

                        // Provider display names
                        const providerNames: Record<string, string> = {
                          'openai': 'OpenAI',
                          'anthropic': 'Anthropic',
                          'google': 'Google',
                          'deepseek': 'DeepSeek',
                          'meta-llama': 'Meta',
                          'mistral': 'Mistral',
                          'perplexity': 'Perplexity',
                        };

                        return Object.entries(groupedModels).map(([provider, providerModels]) => (
                          <ModelSelectorGroup key={provider} heading={providerNames[provider] || provider}>
                            {providerModels.map((model) => (
                              <ModelSelectorItem
                                key={model.modelId}
                                value={model.safeName}
                                onSelect={() => {
                                  setSelectedModel(model.safeName);
                                  setIsModelSelectorOpen(false);
                                }}
                              >
                                <ModelSelectorLogoGroup>
                                  <ModelSelectorLogo provider={provider} />
                                </ModelSelectorLogoGroup>
                                <ModelSelectorName>{model.safeName}</ModelSelectorName>
                              </ModelSelectorItem>
                            ))}
                          </ModelSelectorGroup>
                        ));
                      })()}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
                
                <PromptInput
                  onSubmit={handleSend}
                  className="flex-1 border-gray-300 focus:border-amber-500 focus:ring-amber-500 min-w-0 dark:bg-slate-800 dark:text-gray-100 dark:border-slate-700"
                >
                
                <PromptInputTextarea
                  value={inputValue}
                  className='pr-16'
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
              <div className="text-center text-xs text-gray-500 mt-2 space-y-1">
                <span>AI có thể sai, kiểm chứng trước khi sử dụng.</span>
                <div>
                  <a 
                    href="/chisaAI/privacy" 
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
                    onClick={(e) => {
                      e.preventDefault();
                      window.location.href = '/chisaAI/privacy';
                    }}
                  >
                    Chính sách Bảo mật
                  </a>
                </div>
              </div>
            </div>
    </div>
  );
};

export default ChatbotUI;