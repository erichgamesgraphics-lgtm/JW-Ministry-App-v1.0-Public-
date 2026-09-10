import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  ExternalLink,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Search,
  CheckCircle2,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useMinistry } from '../context/MinistryContext.tsx';

export interface SearchResultItem {
  id: string;
  title: string;
  snippet: string;
  url: string;
  source: 'JW.ORG' | 'WOL.JW.ORG';
  publication?: string;
  bibleVerses?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SearchResultItem[];
  timestamp: number;
}

export const MinistryAIScreen: React.FC = () => {
  const { entries, scheduledEvents, settings, dashboardStats, language, t } = useMinistry();

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Initial welcome message from Ministry Assistant
    return [
      {
        id: 'welcome-1',
        role: 'assistant',
        content: `Hello! I am your **JW Ministry Assistant**.

I am here to assist you with:
- **Ministry Tracker Progress**: Analyzing your monthly hours, goals, return visits, and Bible studies.
- **JW.ORG & WOL Research**: Finding articles, publications, and Scriptural reasoning from **JW.ORG** and **WOL.JW.ORG**.
- **Field Ministry Support**: Locating relevant publications to share when someone asks questions during preaching.

How can I assist your ministry today?`,
        timestamp: Date.now(),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const newHistory = [
      ...messages,
      {
        id: userMsgId,
        role: 'user' as const,
        content: textToSend.trim(),
        timestamp: Date.now(),
      },
    ];

    setMessages(newHistory);
    if (!customText) setInput('');
    setLoading(true);
    setError(null);

    // Prepare API context payload
    const conversationHistoryForApi = newHistory
      .filter(m => m.id !== 'welcome-1')
      .map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        text: m.content,
      }));

    try {
      const response = await fetch('/api/ministry-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: textToSend.trim(),
          conversationHistory: conversationHistoryForApi,
          userContext: {
            stats: dashboardStats,
            entries,
            events: scheduledEvents,
            settings,
          },
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || t.ministryAi.errorMessage);
      }

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          timestamp: Date.now(),
        },
      ]);
    } catch (err: any) {
      console.error('Ministry Assistant Request Error:', err);
      setError(err?.message || t.ministryAi.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Conversation reset. I am your **JW Ministry Assistant**. How can I help you?`,
        timestamp: Date.now(),
      },
    ]);
    setError(null);
  };

  const suggestedQuestions = t.ministryAi.suggestedQuestions || [
    'How am I doing this month?',
    'How many hours do I have left?',
    'Give me some tips.',
    'Find an article about hope.',
    'Search WOL for prayer.',
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-2xl mx-auto pb-2">
      {/* Header Banner */}
      <div className="shrink-0 mb-3 rounded-2xl border border-blue-100 dark:border-blue-900/60 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-sky-50/90 dark:from-blue-950/50 dark:via-indigo-950/30 dark:to-sky-950/40 p-3 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {t.ministryAi.title}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/10 dark:bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  Native Engine
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                {t.ministryAi.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title={t.ministryAi.clearChat}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Conversation Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-sm">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3.5 sm:p-4 shadow-xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-xs'
                  : 'bg-white dark:bg-[#131D31] border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs'
              }`}
            >
              {/* Message Role Icon / Header for Assistant */}
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300">
                    <Sparkles className="h-3 w-3" />
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 tracking-wide uppercase">
                    JW Ministry Assistant
                  </span>
                </div>
              )}

              {/* Message Markdown Body */}
              <div className="prose dark:prose-invert prose-xs max-w-none leading-relaxed text-xs sm:text-sm">
                <Markdown>{msg.content}</Markdown>
              </div>

              {/* Retreived Sources Section (JW.ORG & WOL.JW.ORG) */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/90 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>{t.ministryAi.sourcesHeader} ({msg.sources.length})</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {msg.sources.map(src => (
                      <div
                        key={src.id}
                        className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 p-2.5 transition-all hover:border-blue-300 dark:hover:border-blue-700"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                  src.source === 'JW.ORG'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-indigo-700 text-white'
                                }`}
                              >
                                {src.source}
                              </span>
                              {src.publication && (
                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[160px]">
                                  {src.publication}
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-1 line-clamp-1">
                              {src.title}
                            </h4>

                            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2 leading-snug">
                              {src.snippet}
                            </p>

                            {src.bibleVerses && src.bibleVerses.length > 0 && (
                              <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                {src.bibleVerses.map((verse, vIdx) => (
                                  <span
                                    key={vIdx}
                                    className="inline-block bg-blue-100/80 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-medium px-1.5 py-0.5 rounded-xs"
                                  >
                                    📖 {verse}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <a
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 px-2.5 py-1.5 text-[11px] font-bold text-white transition-all shadow-xs cursor-pointer"
                          >
                            <span>{t.ministryAi.openArticle}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white dark:bg-[#131D31] border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs w-max">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="font-semibold">{t.ministryAi.thinking}</span>
          </div>
        )}

        {/* Error Card with Retry */}
        {error && (
          <div className="p-3.5 rounded-2xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => handleSendMessage()}
              className="inline-flex items-center gap-1 rounded-lg bg-red-600 hover:bg-red-700 px-2.5 py-1 text-[11px] font-bold text-white cursor-pointer shrink-0"
            >
              <RefreshCw className="h-3 w-3" />
              <span>{t.ministryAi.retry}</span>
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips */}
      <div className="shrink-0 pt-2 pb-1">
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
          <Search className="h-3 w-3 text-blue-600 dark:text-blue-400" />
          <span>{t.ministryAi.suggestedTitle}</span>
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              disabled={loading}
              onClick={() => handleSendMessage(q)}
              className="shrink-0 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/90 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:border-blue-300 dark:hover:border-blue-800 px-3 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Field Bar */}
      <div className="shrink-0 pt-1">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder={t.ministryAi.askPlaceholder}
            className="flex-1 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-blue-600 focus:outline-hidden dark:focus:border-blue-500 transition-colors shadow-xs disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-11 w-11 items-center justify-center rounded-xl sm:rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition-all shadow-xs disabled:opacity-40 disabled:hover:bg-blue-600 cursor-pointer shrink-0"
            title="Send"
          >
            <Send className="h-4 w-4 stroke-[2.2]" />
          </button>
        </form>
      </div>
    </div>
  );
};
