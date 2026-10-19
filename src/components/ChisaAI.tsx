import { memo, useEffect, useRef, useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Wrench, User, Square, Trash2, Copy, Check, ArrowDown } from 'lucide-react';
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
import remarkMath from 'remark-math'
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
import { Drawer, DrawerTrigger, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer';
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
import { CodeBlock } from './infsh/code-block';
const API = import.meta.env.VITE_API_URL;

type ChisaAIChatSummary = {
  chatId: string;
  chatUUID?: string;
  title?: string;
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
  disabled: boolean;
  onStop?: () => void;
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
  disabled,
  onStop,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <GradientText className="text-2xl font-normal mb-3 font-loveHouse" colors={["#ffdcff", "#A8DF8E", "#1581BF"]} yoyo={false} animationSpeed={0.8}>
      Ciallo, {fullName || 'Người vô danh'}!
      </GradientText>
      <p className="text-muted-foreground mb-8 max-w-md">
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
                {modelsLoading ? 'Đang tải models...' : (models.find(m => m.safeName === selectedModel)?.safeName || 'Chọn model')}
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
          className="border-2 rounded-md border-border pr-16"
          onChange={(e) => onChangeInput(e.target.value)}
        />
        {isGenerating ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-4 h-8 w-8 rounded-full shadow-sm"
            onClick={onStop}
            title="Dừng tạo câu trả lời"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </Button>
        ) : (
          <PromptInputSubmit
            status={status === 'streaming' ? 'streaming' : 'ready'}
            disabled={disabled || !inputValue.trim()}
            className="absolute right-4"
          />
        )}
      </PromptInput>
      </div>
    </div>
  );
});

function countUnescaped(str: string, delimiter: string): number {
  let count = 0;
  let idx = 0;
  while ((idx = str.indexOf(delimiter, idx)) !== -1) {
    let backslashCount = 0;
    let b = idx - 1;
    while (b >= 0 && str[b] === '\\') {
      backslashCount++;
      b--;
    }
    if (backslashCount % 2 === 0) {
      count++;
    }
    idx += delimiter.length;
  }
  return count;
}

const preprocessLatex = (text: string, isStreaming = false): string => {
  if (!text) return '';
  let processed = text
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$$')
    .replace(/\\\)/g, '$$');

  if (isStreaming) {
    const displayCount = countUnescaped(processed, '$$$$');
    if (displayCount % 2 !== 0) {
      processed += '\n$$$$';
    } else {
      const inlineCount = countUnescaped(processed, '$$');
      const singleDollarCount = inlineCount - (displayCount * 2);
      if (singleDollarCount % 2 !== 0) {
        processed += '$$';
      }
    }
  }

  return processed;
};

function useThrottledText(text: string, isStreaming: boolean, intervalMs = 80): string {
  const [throttledText, setThrottledText] = useState(text);
  const lastUpdateTimeRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStreaming) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setThrottledText(text);
      lastUpdateTimeRef.current = Date.now();
      return;
    }

    const now = Date.now();
    const elapsed = now - lastUpdateTimeRef.current;

    if (elapsed >= intervalMs) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setThrottledText(text);
      lastUpdateTimeRef.current = now;
    } else if (!timerRef.current) {
      timerRef.current = window.setTimeout(() => {
        setThrottledText(text);
        lastUpdateTimeRef.current = Date.now();
        timerRef.current = null;
      }, intervalMs - elapsed);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, isStreaming, intervalMs]);

  return isStreaming ? throttledText : text;
}

const markdownComponents = {
  pre({ children }: any) {
    return <pre className="bg-muted p-2 rounded overflow-x-auto text-xs sm:text-sm dark:bg-muted/20">{children}</pre>;
  },
  code(props: any) {
    const { children, className, node, ...rest } = props;
    void node;
    const match = /language-(\w+)/.exec(className || '');
    const code = String(children).replace(/\n$/, '');

    return match ? (
      <CodeBlock language={match[1]}>
        {code}
      </CodeBlock>
    ) : (
      <code {...rest} className={className}>
        {children}
      </code>
    );
  },
  table({ children }: any) {
    return (
      <div className="overflow-x-auto w-full my-2 border border-border rounded-md">
        <Table className="w-full min-w-[400px]">
          {children}
        </Table>
      </div>
    );
  },
  thead({ children }: any) {
    return <thead className="bg-muted border-b border-border">{children}</thead>;
  },
  th({ children }: any) {
    return (
      <TableHead className="px-3 py-2 border-r last:border-r-0 font-semibold text-xs sm:text-sm text-foreground">
        {children}
      </TableHead>
    );
  },
  td({ children }: any) {
    return (
      <TableCell className="px-3 py-2 border-t border-r last:border-r-0 align-top text-xs sm:text-sm text-foreground">
        {children}
      </TableCell>
    );
  },
  tr({ children }: any) {
    return <TableRow className="even:bg-muted/20 hover:bg-muted/40 transition-colors border-0">{children}</TableRow>;
  },
  h2: ({ children }: any) => (
    <h2 className="mt-5 mb-3 text-lg sm:text-2xl font-bold tracking-tight border-b pb-2">
      {children}
    </h2>
  ),
  ul: ({ children }: any) => (
    <ul className="my-4 ml-6 space-y-2 list-disc">
      {children}
    </ul>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed">
      {children}
    </li>
  ),
};

const staticRemarkPlugins = [remarkGfm, remarkMath, remarkBreak];

const Message = memo(({
  message, 
  index, 
  Part, 
  isStreaming = false
}: {
  message: any, 
  index: number, 
  Part: any, 
  isStreaming?: boolean
}) => {
  const displayText = useThrottledText(Part.text, isStreaming, 80);
  const formattedContent = preprocessLatex(displayText, isStreaming);

  const rehypePlugins = useMemo(() => {
    const plugins: any[] = [
      rehypeRaw,
      [rehypeSanitize, defaultSchema],
      [rehypeKatex, { output: 'html', throwOnError: false, strict: false, errorColor: '#ef4444' }],
      [rehypeSanitize, katexSanitizeSchema],
    ];
    return plugins;
  }, []);

  return (
    <ReactMarkdown 
      key={`${message.id}-streaming-${index}`} 
      remarkPlugins={staticRemarkPlugins}
      rehypePlugins={rehypePlugins}
      components={markdownComponents}
    >
      {formattedContent}
    </ReactMarkdown>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.Part.text === nextProps.Part.text && 
    prevProps.message.id === nextProps.message.id &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});

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
  const [chatSwitchLoading, setChatSwitchLoading] = useState<boolean>(true);
  const [chatSwitchLabel, setChatSwitchLabel] = useState<string>('Đang tạo phiên chat...');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);
  const pendingScrollRafRef = useRef<number | null>(null);
  const [access, setAccess] = useState<boolean>(false);
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [userCheckError, setUserCheckError] = useState<string | null>(null);
  const [userCheckAttempt, setUserCheckAttempt] = useState(0);
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

  const localChatsRef = useRef(new Set(initialHashRef.current ? [] : [chatId]));
  const activeChatRef = useRef(chatId);
  const switchVersionRef = useRef(0);
  const [hydratedChat, setHydratedChat] = useState<string | null>(null);
  const [hydrateAttempt, setHydrateAttempt] = useState(0);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listAttempt, setListAttempt] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [listLoadingMore, setListLoadingMore] = useState(false);
  const listBusyRef = useRef(false);
  const messageBusyRef = useRef(false);
  const listVersionRef = useRef(0);
  const listPagedRef = useRef(false);
  const deletedChatsRef = useRef(new Set<string>());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const deleteBusyRef = useRef(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [modelError, setModelError] = useState<string | null>(null);
  const [modelAttempt, setModelAttempt] = useState(0);
  const persistTimerRef = useRef<number | null>(null);

  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // @ts-ignore
  const {messages, sendMessage, status, id, setMessages, regenerate, stop, clearError} = useChat({
    id: chatId,
    generateId: () => crypto.randomUUID().toString(),
    transport: new DefaultChatTransport({
      api: `${API}/chisaAI/v2/chat`,
      prepareSendMessagesRequest: ({ api, id, messages, body, headers, credentials, trigger, messageId }) => {
        return {
          api,
          headers,
          credentials,
          body: {
            ...body,
            id,
            messages,
            trigger,
            messageId,
            access_token: AuthStorage.getUserToken() || '',
            user_id: user?.UserID || '',
            model: selectedModel,
          },
        };
      },
    }),
    onError: (err) => {
      setError(err.message || 'Đã có lỗi xảy ra trong quá trình kết nối đến máy chủ.');
    },
  });

  const isGenerating = status === 'submitted' || status === 'streaming';
  const canSend = access && hydratedChat === id && !chatSwitchLoading && !deleting && !isGenerating && !isLoadingMore && !modelsLoading && models.some(m => m.safeName === selectedModel);

  const handleCopyMessage = async (msg: any) => {
    const cleanText = msg.parts
      ?.filter((p: any) => p.type === 'text')
      ?.map((p: any) => p.text)
      ?.join('\n\n') || '';
    if (!cleanText) return;
    try {
      await navigator.clipboard.writeText(cleanText);
      setCopyError(null);
      setCopiedMessageId(msg.id);
      setTimeout(() => setCopiedMessageId(null), 1500);
    } catch { setCopyError('Không thể sao chép. Vui lòng chọn và sao chép nội dung thủ công.'); }
  };

  const handleRegenerate = (targetMessageId?: string) => {
    if (!canSend) return;
    const last = messages.at(-1);
    if (!last || last.role !== 'assistant' || targetMessageId !== last.id) return;
    setError(null);
    clearError();
    void regenerate({
      messageId: targetMessageId,
      body: {
        model: selectedModel,
        access_token: AuthStorage.getUserToken() || '',
        user_id: user?.UserID || '',
      },
    }).catch(err => setError(err.message));
  };

  const retryMessage = () => {
    if (!canSend) return;
    const last = messages.at(-1);
    if (!last) return;
    if (last.role === 'assistant') { handleRegenerate(last.id); return; }
    if (last.role !== 'user') return;
    setError(null);
    clearError();
    // Backend regeneration does not save the user; retry a failed submit as a submit.
    void sendMessage({ ...last, messageId: last.id }).catch(err => setError(err.message));
  };

  const handleDeleteChat = async () => {
    const targetChatId = deleteTarget;
    if (!targetChatId || deleteBusyRef.current) return;
    const token = AuthStorage.getUserToken();
    if (!token) return;
    deleteBusyRef.current = true;
    setDeleting(true);
    setDeleteError(null);
    const version = switchVersionRef.current;
    try {
      if (activeChatRef.current === targetChatId) await stop();
      await chisaAIService.deleteChat(token, targetChatId);
      deletedChatsRef.current.add(targetChatId);
      setChatSummaries(prev => prev.filter(c => c.chatId !== targetChatId && c.chatUUID !== targetChatId));
      setDeleteTarget(null);
      if (activeChatRef.current === targetChatId && switchVersionRef.current === version) {
        startNewChat();
      }
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Không thể xóa đoạn chat.');
    } finally {
      deleteBusyRef.current = false;
      setDeleting(false);
    }
  };

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
      if (next !== activeChatRef.current) {
        if (next) openChat(next);
        else startNewChat();
      }
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  });

  const mergeSummaries = (previous: ChisaAIChatSummary[], incoming: ChisaAIChatSummary[]) =>
    [...new Map([...previous, ...incoming].filter(c => !deletedChatsRef.current.has(c.chatId)).map(c => [c.chatId, c])).values()]
      .sort((a, b) => b.updatedAt - a.updatedAt);

  useEffect(() => {
    let cancelled = false;
    const version = ++listVersionRef.current;
    const refreshHistory = async () => {
      const userId = user?.UserID;
      const token = AuthStorage.getUserToken();
      if (!userId || !token) return;
      setHistoryLoading(true);
      setListError(null);
      try {
        const response = await chisaAIService.getChatList(token, null);
        if (cancelled || version !== listVersionRef.current) return;
        // Convert API response to ChisaAIChatSummary format
        const summaries: ChisaAIChatSummary[] = response.chats.map(chat => ({
          chatId: chat.chatUUID,
          title: chat.title,
          userId: userId,
          timestamp: new Date(chat.updatedAt).getTime(),
          updatedAt: new Date(chat.updatedAt).getTime(),
          messageCount: chat.messageCount
        }));
        setChatSummaries(prev => mergeSummaries(prev, summaries));
        if (!listPagedRef.current) setChatListNextToken(response.next_token);
      } catch (error) {
        if (!cancelled) setListError(error instanceof Error ? error.message : 'Không thể tải danh sách chat.');
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    refreshHistory();
    return () => { cancelled = true; };
  }, [user?.UserID, listAttempt]);

  useEffect(() => {
    let cancelled = false;
    const version = switchVersionRef.current;
    const hydrate = async () => {
      const token = AuthStorage.getUserToken();
      if (!access || !user?.UserID || !id || !token) return;
      setHistoryError(null);
      if (localChatsRef.current.has(id)) {
        setHydratedChat(id);
        setChatSwitchLoading(false);
        return;
      }
      setChatSwitchLoading(true);
      setHydratedChat(null);
      try {
        const history = await chisaAIService.getChatHistory(token, id, null);
        if (cancelled || version !== switchVersionRef.current || activeChatRef.current !== id) return;
        // @ts-ignore runtime shape matches UI messages
        setMessages(history.messages);
        setChatHistoryNextToken(history.next_token);
        setHydratedChat(id);
      } catch (error) {
        if (!cancelled && version === switchVersionRef.current) setHistoryError(error instanceof Error ? error.message : 'Không thể tải lịch sử chat.');
      } finally {
        if (!cancelled && version === switchVersionRef.current) setChatSwitchLoading(false);
      }
    };
    void hydrate();
    return () => { cancelled = true; };
  }, [access, user?.UserID, id, setMessages, hydrateAttempt]);

  useEffect(() => {
    const userId = user?.UserID;
    const token = AuthStorage.getUserToken();
    if (!userId || !id || !token) return;
    let cancelled = false;
    const version = listVersionRef.current;

    // Do not refresh for empty chats.
    if (!messages || messages.length === 0 || isGenerating) {
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
          if (cancelled || version !== listVersionRef.current) return;
          const summaries: ChisaAIChatSummary[] = response.chats.map(chat => ({
            chatId: chat.chatUUID,
          title: chat.title,
            userId: userId,
            timestamp: new Date(chat.updatedAt).getTime(),
            updatedAt: new Date(chat.updatedAt).getTime(),
            messageCount: chat.messageCount
          }));
          setChatSummaries(prev => mergeSummaries(prev, summaries));
          if (!listPagedRef.current) setChatListNextToken(response.next_token);
        } catch (error) {
          if (!cancelled) setListError(error instanceof Error ? error.message : 'Không thể cập nhật danh sách chat.');
        }
      })();
    }, 2000);

    return () => {
      cancelled = true;
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [messages, user?.UserID, id, isGenerating]);

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
    if (!chatListNextToken || listBusyRef.current || historyLoading) return;
    
    const token = AuthStorage.getUserToken();
    const userId = user?.UserID;
    if (!token || !userId) return;

    listBusyRef.current = true;
    listPagedRef.current = true;
    setListLoadingMore(true);
    setListError(null);
    const version = listVersionRef.current;
    try {
      const response = await chisaAIService.getChatList(token, chatListNextToken);
      if (version !== listVersionRef.current) return;
      const newSummaries: ChisaAIChatSummary[] = response.chats.map(chat => ({
        chatId: chat.chatUUID,
          title: chat.title,
        userId: userId,
        timestamp: new Date(chat.updatedAt).getTime(),
        updatedAt: new Date(chat.updatedAt).getTime(),
        messageCount: chat.messageCount
      }));
      setChatSummaries(prev => mergeSummaries(prev, newSummaries));
      setChatListNextToken(response.next_token);
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Không thể tải thêm chat.');
    } finally {
      listBusyRef.current = false;
      setListLoadingMore(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!chatHistoryNextToken || messageBusyRef.current || !id || isGenerating || hydratedChat !== id) return;
    
    const token = AuthStorage.getUserToken();
    if (!token) return;

    const version = switchVersionRef.current;
    messageBusyRef.current = true;
    setIsLoadingMore(true);
    setHistoryError(null);
    try {
      const history = await chisaAIService.getChatHistory(token, id, chatHistoryNextToken);
      if (version !== switchVersionRef.current || activeChatRef.current !== id) return;
      if (history?.messages && Array.isArray(history.messages) && history.messages.length > 0) {
        // @ts-ignore
        setMessages(prev => [...new Map([...history.messages, ...prev].map(m => [m.id, m])).values()]);
        setChatHistoryNextToken(history.next_token);
      } else {
        setChatHistoryNextToken(null)
      }
    } catch (error) {
      if (version === switchVersionRef.current) setHistoryError(error instanceof Error ? error.message : 'Không thể tải tin nhắn cũ.');
    } finally {
      if (version === switchVersionRef.current) {
        messageBusyRef.current = false;
        setIsLoadingMore(false);
      }
    }
  };

  const beginChatSwitch = (label: string) => {
    void stop();
    ++switchVersionRef.current;
    messageBusyRef.current = false;
    setIsLoadingMore(false);
    setHydratedChat(null);
    setHistoryError(null);
    setError(null);
    clearError();
    setHistoryOpen(false);
    setChatSwitchLabel(label);
    setChatSwitchLoading(true);
    setExpandedReasoning({});
    setExpandedToolCalls({});
    setInputValue('');
    setChatHistoryNextToken(null);
    // Clear current messages immediately so the UI doesn't flash old chat content.
    // @ts-ignore runtime shape matches the UI messages from useChat
    setMessages([]);

  };

  const startNewChat = () => {
    beginChatSwitch('Đang tạo phiên chat...');
    const newId = crypto.randomUUID().toString();
    localChatsRef.current.add(newId);
    activeChatRef.current = newId;
    setChatId(newId);
    window.location.hash = newId;
  };

  const openChat = (targetChatId: string) => {
    if (!targetChatId) return;
    setHistoryOpen(false);
    if (targetChatId === activeChatRef.current) return;
    localChatsRef.current.delete(targetChatId);
    beginChatSwitch('Đang mở phiên chat...');
    activeChatRef.current = targetChatId;
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
        setUserCheckError("Phiên đã hết hạn, vui lòng đăng nhập lại");
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
        setUserCheckError("Không thể kiểm tra trạng thái người dùng");
      }
    };

    checkUser();
  }, [userCheckAttempt])

  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      setModelError(null);
      try {
        const response = await chisaAIService.getModels();
        if (!response.models.length) throw new Error('Không có model khả dụng.');
        setModels(response.models);
        // Set default model
        const defaultModel = response.models.find(m => m.isDefault);
        if (defaultModel) {
          setSelectedModel(defaultModel.safeName);
        } else if (response.models.length > 0) {
          setSelectedModel(response.models[0].safeName);
        }
      } catch (error) {
        setModels([]);
        setSelectedModel('');
        setModelError(error instanceof Error ? error.message : 'Không thể tải models.');
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [modelAttempt])

  useEffect(() => { setLoading(false); }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onScroll = () => {
      const thresholdPx = 80;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < thresholdPx;
      setShowScrollBottom(distanceFromBottom > 150);
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener('scroll', onScroll);
  }, [loading, access, userExists]);

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
    if (!canSend || !inputValue.trim()) return;
    setError(null);
    clearError();
    localChatsRef.current.delete(id);

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
    void sendMessage(userMsg).catch(err => setError(err.message));
    setInputValue('');
  };

  if (userCheckError) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-md border-2 border-border shadow-brutal">
          <CardContent className="p-6 text-center space-y-4">
            <p role="alert" className="text-sm text-destructive sm:text-base">{userCheckError}</p>
            <Button type="button" onClick={() => {
              setUserCheckError(null);
              setUserExists(null);
              setUserCheckAttempt(attempt => attempt + 1);
            }}>Thử lại</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading || userExists === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-md border-2 border-border shadow-brutal">
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


  if (!access) {
    return (
      <>
        <Dialog open={showTermsDialog} onOpenChange={(open) => !isCreatingUser && setShowTermsDialog(open)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-display font-bold">Điều khoản sử dụng ChisaAI</DialogTitle>
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
    <div className="flex flex-col h-[calc(100dvh-4.5rem)] max-h-[calc(100dvh-4.5rem)] rounded-sm">
      <div className="px-3 sm:px-4 py-2">
        <div className="max-w-screen-md sm:max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">Phiên chat</div>
            <div className="text-sm font-medium truncate text-foreground">
              {id ? id.slice(0, 10) : '...'}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={startNewChat} disabled={deleting}>
              Chat mới
            </Button>

            <Drawer direction="bottom" open={historyOpen} onOpenChange={setHistoryOpen}>
              <DrawerTrigger asChild><Button variant="outline" size="sm">Lịch sử</Button></DrawerTrigger>
              <DrawerContent className="mx-auto h-[85dvh] max-h-[85dvh] w-full max-w-2xl">
                <DrawerHeader><DrawerTitle>Lịch sử trò chuyện</DrawerTitle><DrawerDescription>Chọn đoạn chat để tiếp tục trò chuyện.</DrawerDescription></DrawerHeader>
                <div className="min-h-0 flex-1 overflow-y-auto space-y-2 px-4" aria-busy={historyLoading || listLoadingMore}>
                  {historyLoading && <p role="status">Đang tải lịch sử…</p>}
                  {listError && <div role="alert" className="text-destructive">{listError}<Button disabled={historyLoading || listLoadingMore} onClick={() => setListAttempt(n => n + 1)}>Thử tải lại danh sách</Button></div>}
                  {!historyLoading && !listError && !chatSummaries.length && <p>Chưa có lịch sử.</p>}
                  {chatSummaries.map(c => <div key={c.chatId} className={`flex items-center rounded border ${c.chatId === id ? 'bg-accent border-primary' : 'border-border'}`}>
                    <button type="button" aria-current={c.chatId === id ? 'true' : undefined} onClick={() => openChat(c.chatId)} className="min-w-0 flex-1 p-3 text-left rounded focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="block truncate font-medium">{c.title || c.chatId.slice(0, 12)}</span>
                      <span className="block text-xs text-muted-foreground">{c.messageCount} tin • {formatTime(c.updatedAt)}{c.chatId === id ? ' • Đang chọn' : ''}</span>
                    </button>
                    <Button variant="ghost" size="icon" aria-label={`Xóa đoạn chat ${c.title || c.chatId}`} disabled={deleting} onClick={() => { setDeleteError(null); setDeleteTarget(c.chatId); }}><Trash2 className="h-4 w-4" /></Button>
                  </div>)}
                  {chatListNextToken && <Button variant="outline" className="w-full" disabled={historyLoading || listLoadingMore} onClick={loadMoreChats}>{listLoadingMore ? 'Đang tải...' : 'Tải thêm chat'}</Button>}
                </div>
                <DrawerFooter className="pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button onClick={startNewChat}>Tạo chat mới</Button>
                  <DrawerClose asChild><Button variant="outline">Đóng</Button></DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <Dialog open={!!deleteTarget} onOpenChange={open => { if (!open && !deleting) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Xóa đoạn chat?</DialogTitle><DialogDescription>Thao tác này không thể hoàn tác.</DialogDescription></DialogHeader>
          {deleteError && <p role="alert" className="text-destructive">{deleteError}</p>}
          <DialogFooter><Button variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>Hủy</Button><Button variant="destructive" disabled={deleting} onClick={handleDeleteChat}>{deleting ? 'Đang xóa...' : 'Xóa đoạn chat'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
      {historyError && <div role="alert" className="px-4 text-sm text-destructive">{historyError}<Button variant="outline" onClick={() => hydratedChat === id ? loadMoreMessages() : setHydrateAttempt(n => n + 1)} disabled={chatSwitchLoading || isLoadingMore}>Thử tải lại lịch sử</Button></div>}
      {modelError && <div role="alert" className="px-4 text-sm text-destructive">{modelError}<Button variant="outline" onClick={() => setModelAttempt(n => n + 1)} disabled={modelsLoading}>Thử tải lại models</Button></div>}
      {copyError && <p role="alert" className="px-4 text-sm text-destructive">{copyError}</p>}
      <div ref={scrollContainerRef} className="relative flex-1 min-h-0 overflow-y-auto px-4 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {chatSwitchLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/90">
            <Card className="w-full max-w-sm rounded-md border-2 border-border shadow-brutal">
              <CardContent className="p-6 text-center">
                <LoaderIcon />
                <p className="mt-2 text-sm sm:text-base text-foreground">{chatSwitchLabel}</p>
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
            disabled={!canSend}
            onStop={stop}
          />
        ) : (
          <div className="max-w-screen-md sm:max-w-7xl mx-auto space-y-6">
            {chatHistoryNextToken && (
              <div className="text-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={loadMoreMessages}
                  disabled={isLoadingMore || isGenerating}
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
                  <Avatar className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-section border-2 border-border items-center justify-center flex-shrink-0 mt-1 overflow-hidden hidden lg:flex">
                    <img src='/chisaAI.png' alt="Chisa" className="w-full h-full object-cover" />
                  </Avatar>
                )}

                <div className="flex flex-col gap-2 max-w-[90%] sm:max-w-[85%] min-w-0">
                  {/* Reasoning Dropdown */}
                  {message.parts.find((part) => part.type === 'reasoning') && (
                    <Card className="border-2 border-border bg-secondary overflow-hidden">
                      <button
                        onClick={() => toggleReasoning(message.id)}
                        className="w-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:bg-secondary/80 transition-colors text-sm sm:text-base"
                      >
                        {expandedReasoning[message.id] ? (
                          <ChevronDown className="w-4 h-4 text-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-foreground" />
                        )}
                        <Sparkles className="w-4 h-4 text-foreground" />
                        <span className="text-sm font-bold text-foreground">
                          Suy nghĩ của chisa
                        </span>
                      </button>
                      {expandedReasoning[message.id] && (
                        <div className="px-3 sm:px-4 pb-3 pt-1">
                          <p className="text-sm text-muted-foreground leading-relaxed break-words">
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
                    <Card className="border-2 border-border bg-section overflow-hidden">
                      <button
                        onClick={() => toggleToolCalls(message.id)}
                        className="w-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:bg-section/90 transition-colors text-sm sm:text-base"
                      >
                        {expandedToolCalls[message.id] ? (
                          <ChevronDown className="w-4 h-4 text-section-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-section-foreground" />
                        )}
                        <Wrench className="w-4 h-4 text-section-foreground" />
                        <span className="text-sm font-bold text-section-foreground">
                          Used {message.parts.filter((part) => part.type.includes('tool')).length} tool{message.parts.filter((part) => part.type.includes('tool')).length > 1 ? 's' : ''}
                        </span>
                      </button>
                      {expandedToolCalls[message.id] && (
                        <div className="px-3 sm:px-4 pb-3 pt-1 space-y-3 text-xs sm:text-sm text-section-foreground">
                          {message.parts.map((part, idx) =>
                            part.type.startsWith('tool-') ? (
                              <div key={idx}>

                                {// @ts-expect-error "This work btw"
                                part.state === 'output-available' && (
                                  <div>
                                    Sử dụng công cụ {' '}
                                    {TOOL_NAME_VI_MAP[part.type.replace('tool-', '').toUpperCase() as keyof typeof TOOL_NAME_VI_MAP]?.toLowerCase() ||
                                      part.type}
                                    <pre className="mt-1 overflow-x-auto max-h-60 overflow-y-auto text-xs bg-card text-foreground border-2 border-border rounded-md p-2">{/* @ts-expect-error "This work btw" */
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
                    className={`px-3 py-2.5 sm:px-4 sm:py-3 overflow-auto rounded-md border-2 border-border ${message.role === 'user' ? 'bg-secondary text-black self-end' : 'bg-card'}`}
                    style={{ wordBreak: 'break-word' }}
                  >
                    <div className={`text-sm sm:text-base leading-relaxed break-words ${message.role === 'user' ? 'text-black' : 'text-foreground'}`}>
                      {message.parts.map((Part, index) =>
                        Part.type === "text" ? (
                          <Message key={index} message={message} index={index} Part={Part} isStreaming={isGenerating && message.role === 'assistant' && message.id === messages[messages.length - 1]?.id} />
                        ) : null
                      )}
                    </div>
                  </div>
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => handleCopyMessage(message)}
                        title="Sao chép nội dung"
                      >
                        {copiedMessageId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                      {message.id === messages.at(-1)?.id && canSend && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => handleRegenerate(message.id)}
                          title="Tạo lại câu trả lời"
                        >
                          <VscDebugRestart className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary border-2 border-border hidden lg:flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-black" />
                  </div>
                )}
              </div>
            ))}

            {error && (
              <div role="alert" className="flex items-center justify-between p-3 my-2 border-2 border-destructive bg-destructive/10 rounded-md text-destructive text-sm">
                <span className="break-words pr-2">{error}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={retryMessage}
                    disabled={!canSend}
                  >
                    Thử lại
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={() => {
                      setError(null);
                      clearError();
                    }}
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}

        {showScrollBottom && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="sticky bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full h-8 w-8 bg-background/80 backdrop-blur border shadow-md hover:bg-accent"
            title="Cuộn xuống dưới cùng"
          >
            <ArrowDown className="w-4 h-4 text-muted-foreground" />
          </Button>
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
                        {modelsLoading ? 'Đang tải...' : (models.find(m => m.safeName === selectedModel)?.safeName || selectedModel)}
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
                  className="flex-1 border-2 border-border min-w-0"
                >
                
                <PromptInputTextarea
                  value={inputValue}
                  className='pr-16'
                  placeholder="Chat với ChisaAI..."
                  onChange={(e) => setInputValue(e.target.value)}
                />
                {isGenerating ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-4 h-8 w-8 rounded-full shadow-sm"
                    onClick={stop}
                    title="Dừng tạo câu trả lời"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </Button>
                ) : (
                  <PromptInputSubmit
                    status={status}
                    disabled={!canSend || !inputValue.trim()}
                    className='absolute right-4'
                  />
                )}
                </PromptInput>
              </div>
              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground mt-2 space-y-1">
                <span>AI có thể sai, kiểm chứng trước khi sử dụng.</span>
                <div>
                  <a
                    href="/chisaAI/privacy"
                    className="text-foreground font-bold hover:text-section underline"
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
