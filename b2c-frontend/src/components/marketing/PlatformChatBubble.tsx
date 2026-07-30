'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  ChevronDown,
  Infinity,
  MessageCircle,
  MessageSquare,
  Search,
  Send,
  X,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/src/lib/utils';
import { ChatMessageContent } from '@/src/components/marketing/ChatMessageContent';
import {
  listPlatformChatModels,
  sendPlatformChat,
  type ChatMessage,
  type PlatformChatModelOption,
} from '@/src/features/platform-chat/platformChatApi';
import { ApiError } from '@/src/infrastructure/apiClient';

const MODEL_STORAGE_KEY = 'bina-platform-chat-model';
const MODE_STORAGE_KEY = 'bina-platform-chat-mode';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const INPUT_MIN_HEIGHT = 36;
const INPUT_MAX_HEIGHT = 120;

/** Map retired OpenRouter slugs saved in older browsers to current IDs. */
const LEGACY_MODEL_ALIASES: Record<string, string> = {
  'anthropic/claude-haiku-4': 'anthropic/claude-haiku-4.5',
  'google/gemini-2.0-flash-001': 'google/gemini-2.5-flash',
};

type ChatMode = 'ask' | 'agent';

type ChatItem =
  | { kind: 'message'; message: ChatMessage }
  | { kind: 'mode-divider'; mode: ChatMode; id: string };

const WELCOME: Record<ChatMode, ChatMessage> = {
  ask: {
    role: 'assistant',
    content:
      "Hi — I'm Bina's platform assistant. Ask about pricing, AI courses, skill assessments, labs, or how to get started.",
  },
  agent: {
    role: 'assistant',
    content:
      "Agent mode helps you explore learning paths and next steps on AIStudy. Tell me your goal and I'll guide you.",
  },
};

function normalizeModelChoice(model: string, options: PlatformChatModelOption[]): string {
  const allowed = new Set(options.map((m) => m.id));
  if (allowed.has(model)) return model;
  const aliased = LEGACY_MODEL_ALIASES[model];
  if (aliased && allowed.has(aliased)) return aliased;
  return options[0]?.id ?? DEFAULT_MODEL;
}

function loadStoredModel(options: PlatformChatModelOption[] = []): string {
  if (typeof window === 'undefined') return DEFAULT_MODEL;
  try {
    const stored = localStorage.getItem(MODEL_STORAGE_KEY) ?? DEFAULT_MODEL;
    return options.length ? normalizeModelChoice(stored, options) : stored;
  } catch {
    return DEFAULT_MODEL;
  }
}

function loadStoredMode(): ChatMode {
  if (typeof window === 'undefined') return 'ask';
  try {
    const value = localStorage.getItem(MODE_STORAGE_KEY);
    return value === 'agent' ? 'agent' : 'ask';
  } catch {
    return 'ask';
  }
}

function initialChatItems(): ChatItem[] {
  const mode = loadStoredMode();
  return [{ kind: 'message', message: WELCOME[mode] }];
}

const WELCOME_CONTENTS = new Set([WELCOME.ask.content, WELCOME.agent.content]);

function toApiMessages(items: ChatItem[]): ChatMessage[] {
  return items
    .filter((item): item is { kind: 'message'; message: ChatMessage } => item.kind === 'message')
    .map((item) => item.message)
    .filter((m) => !(m.role === 'assistant' && WELCOME_CONTENTS.has(m.content)));
}

function resizeTextarea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(Math.max(el.scrollHeight, INPUT_MIN_HEIGHT), INPUT_MAX_HEIGHT)}px`;
}

function ModeDivider({ mode }: { mode: ChatMode }) {
  const label = mode === 'ask' ? 'Ask mode' : 'Agent mode';
  const Icon = mode === 'ask' ? MessageSquare : Infinity;

  return (
    <div className="flex items-center gap-2 py-0.5" aria-label={`Switched to ${label}`}>
      <div className="h-px flex-1 bg-line" />
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-bg-elev px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-3">
        <Icon className="size-2.5" />
        {label}
      </span>
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant';
  return (
    <div className={cn('flex gap-2', !isAssistant && 'flex-row-reverse')}>
      {isAssistant ? (
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-3" strokeWidth={2} />
        </span>
      ) : null}
      <div
        className={cn(
          'max-w-[88%] rounded-sm px-3 py-2 text-sm leading-relaxed',
          isAssistant
            ? 'border border-line bg-bg-elev text-ink'
            : 'bg-primary text-primary-ink',
        )}
      >
        {isAssistant ? (
          <ChatMessageContent content={message.content} />
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        )}
      </div>
    </div>
  );
}

function ModelSwitcher({
  model,
  options,
  open,
  onToggle,
  onSelect,
  disabled,
}: {
  model: string;
  options: PlatformChatModelOption[];
  open: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === model);
  const shortLabel = selected?.shortLabel ?? 'Model';

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, onToggle]);

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        disabled={disabled}
        onClick={onToggle}
        className="flex h-7 items-center gap-1 rounded-xl border border-line bg-bg-elev px-2.5 text-xs font-medium text-ink transition hover:bg-bg-soft disabled:opacity-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{shortLabel}</span>
        <ChevronDown className={cn('size-3.5 text-ink-3 transition', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.ul
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute bottom-full right-0 z-10 mb-2 min-w-[168px] overflow-hidden rounded-sm border border-line bg-bg-elev py-1 shadow-lg"
          >
            {options.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === model}
                  onClick={() => onSelect(option.id)}
                  className={cn(
                    'flex w-full flex-col items-start px-3 py-1.5 text-left text-sm transition hover:bg-bg-soft',
                    option.id === model ? 'bg-primary/10 text-primary' : 'text-ink',
                  )}
                >
                  <span className="text-xs font-medium">{option.shortLabel}</span>
                  <span className="text-[11px] text-ink-3">{option.label}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function PlatformChatBubble() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ChatMode>(() => loadStoredMode());
  const [chatItems, setChatItems] = useState<ChatItem[]>(() => initialChatItems());
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const modelsQ = useQuery({
    queryKey: ['platform-chat-models', 'v2'],
    queryFn: listPlatformChatModels,
    staleTime: 5 * 60_000,
  });

  const modelOptions = modelsQ.data?.models ?? [];

  useEffect(() => {
    if (!modelOptions.length) return;
    const resolved = normalizeModelChoice(loadStoredModel(modelOptions), modelOptions);
    setModel(resolved);
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, resolved);
    } catch {
      /* ignore */
    }
  }, [modelOptions]);

  useEffect(() => {
    if (!pending && open) {
      inputRef.current?.focus();
    }
  }, [pending, open]);

  useEffect(() => {
    resizeTextarea(inputRef.current);
  }, [input, open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatItems, pending, open]);

  function onModeChange(next: ChatMode) {
    if (next === mode) return;
    setMode(next);
    setChatItems((prev) => [
      ...prev,
      { kind: 'mode-divider', mode: next, id: `${Date.now()}-${next}` },
    ]);
    setError(null);
    try {
      localStorage.setItem(MODE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  function onModelChange(next: string) {
    setModel(next);
    setModelMenuOpen(false);
    try {
      localStorage.setItem(MODEL_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setError(null);
    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    const nextItems: ChatItem[] = [...chatItems, { kind: 'message', message: userMessage }];
    setChatItems(nextItems);
    setInput('');
    setPending(true);

    try {
      const apiMessages = toApiMessages(nextItems);
      const resolvedModel = modelOptions.length
        ? normalizeModelChoice(model, modelOptions)
        : model;
      const { reply } = await sendPlatformChat(apiMessages, resolvedModel);
      setChatItems([
        ...nextItems,
        { kind: 'message', message: { role: 'assistant', content: reply } },
      ]);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to reach the assistant. Please try again.',
      );
      setChatItems(nextItems);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={cn(
              'fixed z-[60] flex flex-col overflow-hidden rounded-lg border dark:border-gray-600 border-gray-300 bg-bg shadow-[0_20px_60px_rgba(15,23,42,0.14)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]',
              'bottom-[4.75rem] left-3 right-3 h-[min(62vh,460px)]',
              'sm:left-auto sm:right-5 sm:w-[min(calc(100vw-2.5rem),400px)] sm:h-[min(70vh,540px)]',
              'md:w-[min(calc(100vw-2.5rem),440px)] md:h-[min(74vh,600px)]',
              'lg:right-6 lg:w-[480px] lg:h-[min(78vh,660px)]',
            )}
          >
            <header className="flex shrink-0 items-center justify-between border-b border-line px-3 py-2.5">
              <p className="text-sm font-semibold text-ink">Bina Assistant</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid size-7 place-items-center rounded-sm text-ink-3 transition hover:bg-bg-soft hover:text-ink"
                aria-label="Close chat"
              >
                <X className="size-3.5" />
              </button>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-bg-soft/50 px-3 py-3">
              {chatItems.map((item, index) =>
                item.kind === 'mode-divider' ? (
                  <ModeDivider key={item.id} mode={item.mode} />
                ) : (
                  <MessageBubble key={`msg-${index}`} message={item.message} />
                ),
              )}
              {pending ? (
                <div className="flex gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Bot className="size-3" />
                  </span>
                  <div className="rounded-sm border border-line bg-bg-elev px-3 py-2 text-sm text-ink-3">
                    <span className="inline-flex gap-1">
                      <span className="animate-pulse">●</span>
                      <span className="animate-pulse [animation-delay:150ms]">●</span>
                      <span className="animate-pulse [animation-delay:300ms]">●</span>
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? <p className="shrink-0 px-3 pb-1 text-xs text-bad">{error}</p> : null}

            <div className="shrink-0 border-t border-line bg-bg p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <div className="inline-flex rounded-full border border-line bg-bg-soft p-0.5">
                  <button
                    type="button"
                    onClick={() => onModeChange('ask')}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition',
                      mode === 'ask'
                        ? 'bg-bg-elev text-ink shadow-sm'
                        : 'text-ink-3 hover:text-ink-2',
                    )}
                  >
                    <MessageSquare className="size-3" />
                    Ask
                  </button>
                  <button
                    type="button"
                    onClick={() => onModeChange('agent')}
                    className={cn(
                      'flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium transition',
                      mode === 'agent'
                        ? 'bg-bg-elev text-ink shadow-sm'
                        : 'text-ink-3 hover:text-ink-2',
                    )}
                  >
                    <Infinity className="size-3" />
                    Agent
                  </button>
                </div>

                <ModelSwitcher
                  model={model}
                  options={modelOptions}
                  open={modelMenuOpen}
                  onToggle={() => setModelMenuOpen((v) => !v)}
                  onSelect={onModelChange}
                  disabled={pending}
                />
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit(input);
                }}
              >
                <div className="flex min-h-9 items-center gap-2 rounded-sm border border-line bg-bg-soft px-2.5 py-2 transition focus-within:border-primary/50 focus-within:bg-bg-elev">
                  <Search className="size-3.5 shrink-0 -translate-y-px text-ink-3" />
                  <textarea
                    ref={inputRef}
                    value={input}
                    rows={1}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void submit(input);
                      }
                    }}
                    placeholder="Ask me anything..."
                    disabled={pending}
                    className="max-h-[120px] min-h-[36px] min-w-0 flex-1 resize-none bg-transparent py-1 text-sm leading-5 text-ink outline-none placeholder:text-ink-3"
                  />
                  <button
                    type="submit"
                    disabled={pending || !input.trim()}
                    onMouseDown={(e) => e.preventDefault()}
                    className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-3 transition hover:bg-bg-soft hover:text-primary disabled:opacity-40"
                    aria-label="Send message"
                  >
                    <Send className="size-3.5" />
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        data-tour="tour-ask-bina"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className={cn(
          'fixed bottom-5 right-4 z-[60] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-primary-ink shadow-[var(--shadow-primary)] transition hover:bg-primary-dark sm:right-6',
          open && 'ring-2 ring-primary/30 ring-offset-2 ring-offset-bg',
        )}
        aria-expanded={open}
        aria-label={open ? 'Close chat assistant' : 'Open chat assistant'}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="hidden sm:inline">{open ? 'Close' : 'Ask Bina'}</span>
      </motion.button>
    </>
  );
}
