import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  Trash2,
  ExternalLink,
  BookOpen,
  AlertCircle,
  RotateCcw,
  BarChart2,
  Search,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { MinistryAIMessage, JWSourceResult } from '../types.ts';
import { MinistryAnalyticsService } from '../services/MinistryAnalyticsService.ts';
import { MinistryAIServiceClient } from '../services/MinistryAIServiceClient.ts';

const STORAGE_KEY = 'jw_ministry_ai_history_v1';

export const MinistryAIScreen: React.FC = () => {
  const { entries, events, settings, t } = useMinistry();
  const [messages, setMessages] = useState<MinistryAIMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<'searching' | 'analyzing' | 'thinking'>(
    'thinking'
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Save conversation history to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Scroll to bottom smoothly when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    setInputQuery('');

    // Create user message
    const userMsg: MinistryAIMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Dynamic loading stage indicator based on query keywords
    const lowerQ = query.toLowerCase();
    const isProgress =
      lowerQ.includes('hour') ||
      lowerQ.includes('goal') ||
      lowerQ.includes('progress') ||
      lowerQ.includes('left') ||
      lowerQ.includes('час') ||
      lowerQ.includes('цел') ||
      lowerQ.includes('ժամ') ||
      lowerQ.includes('նպատակ') ||
      lowerQ.includes('घंटे') ||
      lowerQ.includes('ਘੰਟੇ');

    setLoadingStage(isProgress ? 'analyzing' : 'searching');

    // Slight progression to 'thinking' after a moment
    const stageTimer = setTimeout(() => {
      setLoadingStage('thinking');
    }, 1200);

    try {
      // Calculate real up-to-date analytics from local data
      const analytics = MinistryAnalyticsService.generateSummary(
        entries,
        events,
        settings,
        settings.language
      );

      const response = await MinistryAIServiceClient.ask(query, settings.language, analytics);

      clearTimeout(stageTimer);

      const assistantMsg: MinistryAIMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        timestamp: Date.now(),
        sources: response.sources,
        intent: response.intent,
        status: response.status,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      clearTimeout(stageTimer);
      console.error('Ministry AI error:', err);

      const errorAssistantMsg: MinistryAIMessage = {
        id: `ai-err-${Date.now()}`,
        role: 'assistant',
        content: err?.message || t.ministryAi.errorOccurred,
        timestamp: Date.now(),
        status: 'error',
      };
      setMessages((prev) => [...prev, errorAssistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowClearConfirm(false);
  };

  const handleRetryLast = () => {
    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const suggestionChips = [
    t.ministryAi.suggestedQ1,
    t.ministryAi.suggestedQ2,
    t.ministryAi.suggestedQ3,
    t.ministryAi.suggestedQ4,
    t.ministryAi.suggestedQ5,
    t.ministryAi.suggestedQ6,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] sm:h-[calc(100vh-145px)] pb-2 max-w-4xl mx-auto">
      {/* Top Bar / Header Section */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-linear-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white shadow-md shadow-blue-500/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {t.ministryAi.title}
              </h1>
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                {t.ministryAi.badge}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {t.ministryAi.shortDescription}
            </p>
          </div>
        </div>

        {/* Clear Chat button */}
        {messages.length > 0 && (
          <div className="relative">
            {showClearConfirm ? (
              <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-xl border border-rose-200 dark:border-rose-900/60">
                <button
                  onClick={handleClearChat}
                  className="px-2 py-1 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg cursor-pointer"
                >
                  {t.common.confirm}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  {t.common.cancel}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                title={t.ministryAi.clearChat}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.ministryAi.clearChat}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 selection:bg-blue-500/20">
        {/* Welcome state when no messages */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-linear-to-tr from-blue-600 via-indigo-600 to-sky-400 text-white shadow-lg shadow-blue-500/25">
              <Sparkles className="h-8 w-8" />
            </div>

            <div className="max-w-md space-y-2 px-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {t.ministryAi.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {t.ministryAi.shortDescription}
              </p>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-2">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>{t.ministryAi.groundedNotice}</span>
              </div>
            </div>

            {/* Quick Suggestions Chips */}
            <div className="w-full max-w-lg space-y-2 pt-2 px-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-left pl-1">
                {t.ministryAi.suggestedTitle}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip)}
                    className="flex items-center text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#111928] hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 text-xs font-medium text-slate-700 dark:text-slate-200 transition-all shadow-xs group cursor-pointer"
                  >
                    <span className="flex-1 leading-snug">{chip}</span>
                    <Sparkles className="h-3.5 w-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
            >
              {/* Bubble */}
              <div
                className={`max-w-[90%] sm:max-w-[82%] rounded-2xl p-4 sm:p-4.5 text-sm leading-relaxed shadow-xs ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-xs font-medium'
                    : 'bg-white dark:bg-[#111928] text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-800/80 rounded-bl-xs'
                }`}
              >
                {/* Assistant header tag */}
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/60">
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-blue-600 text-white text-[10px]">
                      <Sparkles className="h-3 w-3" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {t.ministryAi.title}
                    </span>
                    {msg.intent === 'MINISTRY_PROGRESS' && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                        <BarChart2 className="h-3 w-3" />
                        {t.ministryAi.modeProgress}
                      </span>
                    )}
                    {(msg.intent === 'JW_RESEARCH' || (msg.sources && msg.sources.length > 0)) && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                        <BookOpen className="h-3 w-3" />
                        {t.ministryAi.modeResearch}
                      </span>
                    )}
                  </div>
                )}

                {/* Markdown / text formatting */}
                <div className="space-y-2 whitespace-pre-line text-sm leading-relaxed">
                  {msg.content}
                </div>

                {/* Error status retry */}
                {msg.status === 'error' && (
                  <div className="mt-3 pt-2 border-t border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{t.ministryAi.errorOccurred}</span>
                    </div>
                    <button
                      onClick={handleRetryLast}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      {t.ministryAi.retry}
                    </button>
                  </div>
                )}
              </div>

              {/* Verified Sources Cards (for JW research) */}
              {!isUser && msg.sources && msg.sources.length > 0 && (
                <div className="w-full max-w-[95%] sm:max-w-[85%] mt-2 space-y-2 pl-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{t.ministryAi.sourcesCount(msg.sources.length)}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {msg.sources.map((source: JWSourceResult) => (
                      <div
                        key={source.id}
                        className="flex flex-col justify-between p-3 rounded-xl bg-slate-100/80 dark:bg-[#162032] border border-slate-200/80 dark:border-slate-800/80 hover:border-blue-400 dark:hover:border-blue-500 transition-all space-y-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                source.source === 'JW.ORG'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                              }`}
                            >
                              {source.source}
                            </span>
                            {source.context && (
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                                {source.context}
                              </span>
                            )}
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {source.title}
                          </h4>

                          {source.summary && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                              {source.summary}
                            </p>
                          )}

                          {source.scripture && (
                            <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40 p-1.5 rounded-lg">
                              📖 {source.scripture}
                            </div>
                          )}
                        </div>

                        <a
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-between w-full text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 pt-1 border-t border-slate-200/50 dark:border-slate-700/50 cursor-pointer"
                        >
                          <span>{t.ministryAi.openArticle}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator with Stage Message */}
        {isLoading && (
          <div className="flex items-start space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shrink-0 mt-1">
              <Sparkles className="h-4 w-4 animate-spin" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-bl-xs bg-white dark:bg-[#111928] border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5 max-w-sm">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                  {loadingStage === 'searching'
                    ? t.ministryAi.searchingSources
                    : loadingStage === 'analyzing'
                    ? t.ministryAi.analyzingProgress
                    : t.ministryAi.thinking}
                </span>
              </div>
              <div className="w-44 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full animate-[progress_1.5s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips row above input if there are active messages */}
      {messages.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 uppercase tracking-wider pl-1">
            {t.ministryAi.suggestedTitle}:
          </span>
          {suggestionChips.slice(0, 3).map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              disabled={isLoading}
              className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="mt-1 relative flex items-center rounded-2xl bg-white dark:bg-[#111928] border border-slate-300 dark:border-slate-700 shadow-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 p-1.5 shrink-0"
      >
        <div className="pl-2 text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={t.ministryAi.inputPlaceholder}
          disabled={isLoading}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || isLoading}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white transition-all shadow-xs cursor-pointer"
          title={t.ministryAi.send}
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};
