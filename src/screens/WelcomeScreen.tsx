import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  FileText,
  ShieldCheck,
  BookOpen,
  Flame,
  Award,
  Crown,
  Sliders,
  Check,
  Target,
  Globe,
  ChevronDown,
  X,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { JWMinistryLogo } from '../components/JWMinistryLogo.tsx';
import { PublisherStatusType, SupportedLanguage } from '../types.ts';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const { completeOnboarding, language, updateLanguage, t } = useMinistry();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoal, setSelectedGoal] = useState<PublisherStatusType>('PUBLISHER');
  const [customHours, setCustomHours] = useState<number>(40);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);

  const languageOptions: Array<{ code: SupportedLanguage; label: string; nativeLabel: string }> = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hy', label: 'Armenian', nativeLabel: 'Հայերեն' },
    { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  ];

  const currentLanguageObj = languageOptions.find(l => l.code === language) || languageOptions[0];

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    updateLanguage(langCode);
    setShowLanguageModal(false);
  };

  const handleFinish = () => {
    let finalCustomHours = customHours;
    if (selectedGoal === 'CUSTOM') {
      if (isNaN(finalCustomHours) || finalCustomHours <= 0) {
        finalCustomHours = 40;
      }
    }
    completeOnboarding(selectedGoal, selectedGoal === 'CUSTOM' ? finalCustomHours : undefined);
    onContinue();
  };

  const goalCards = [
    {
      id: 'PUBLISHER' as PublisherStatusType,
      title: t.goals.publisher,
      badge: t.goals.publisherBadge,
      icon: BookOpen,
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
      description: t.goals.publisherDesc,
      targetText: t.goals.publisherTarget,
    },
    {
      id: 'AUXILIARY_PIONEER' as PublisherStatusType,
      title: t.goals.auxiliaryPioneer,
      badge: t.goals.auxiliaryPioneerBadge,
      icon: Flame,
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
      description: t.goals.auxiliaryPioneerDesc,
      targetText: t.goals.auxiliaryPioneerTarget,
    },
    {
      id: 'PIONEER' as PublisherStatusType,
      title: t.goals.pioneer,
      badge: t.goals.pioneerBadge,
      icon: Award,
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
      description: t.goals.pioneerDesc,
      targetText: t.goals.pioneerTarget,
    },
    {
      id: 'SPECIAL_PIONEER' as PublisherStatusType,
      title: t.goals.specialPioneer,
      badge: t.goals.specialPioneerBadge,
      icon: Crown,
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
      description: t.goals.specialPioneerDesc,
      targetText: t.goals.specialPioneerTarget,
    },
    {
      id: 'CUSTOM' as PublisherStatusType,
      title: t.goals.custom,
      badge: t.goals.customBadge,
      icon: Sliders,
      iconColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
      description: t.goals.customDesc,
      targetText: t.goals.customTarget,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-[#0B1120] dark:via-[#0E1729] dark:to-[#131D31] text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {/* Top Header Row with Language Selector */}
      <div className="mx-auto w-full max-w-lg flex items-center justify-between pt-1 pb-2">
        {step === 2 ? (
          <button
            onClick={() => setStep(1)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t.common.back}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={() => setShowLanguageModal(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-[#131D31]/90 backdrop-blur-xs px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
        >
          <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>{currentLanguageObj.nativeLabel}</span>
          <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />
        </button>
      </div>

      {step === 1 ? (
        /* STEP 1: WELCOME & FEATURE OVERVIEW */
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between">
          <div className="pt-2 sm:pt-4 text-center">
            <div className="flex justify-center">
              <JWMinistryLogo size={80} className="rounded-3xl shadow-lg" />
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>{t.welcome.badgePrivate}</span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.welcome.title}
            </h1>

            <p className="mt-2 text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 leading-relaxed px-2">
              {t.welcome.subtitle}
            </p>

            {/* Feature Cards */}
            <div className="mt-5 space-y-2.5 text-left">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t.welcome.feature1Title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t.welcome.feature1Desc}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t.welcome.feature2Title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t.welcome.feature2Desc}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t.welcome.feature3Title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t.welcome.feature3Desc}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    {t.welcome.feature4Title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t.welcome.feature4Desc}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-6 pb-2">
            <button
              onClick={() => setStep(2)}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{t.welcome.nextButton}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: CHOOSE YOUR MINISTRY GOAL */
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between">
          <div className="pt-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">
              <span>{t.welcome.stepIndicator}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {t.welcome.step2Title}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
              {t.welcome.step2Subtitle}
            </p>

            {/* Goal Selection Cards */}
            <div className="mt-4 space-y-2.5">
              {goalCards.map((card) => {
                const IconComponent = card.icon;
                const isSelected = selectedGoal === card.id;

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedGoal(card.id)}
                    className={`relative rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131D31] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                              {card.title}
                            </h3>
                            <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                              {card.badge}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-snug">
                            {card.description}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                            {card.targetText}
                          </p>
                        </div>
                      </div>

                      {/* Selection Checkmark */}
                      <div className="shrink-0 pt-0.5">
                        <div
                          className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-blue-600 bg-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-transparent'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>

                    {/* Custom Hours Input when Custom is selected */}
                    {card.id === 'CUSTOM' && isSelected && (
                      <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between gap-3">
                        <label htmlFor="custom-goal-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t.welcome.customGoalLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="custom-goal-input"
                            type="number"
                            min="1"
                            max="300"
                            value={customHours || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCustomHours(isNaN(val) ? 0 : Math.max(1, Math.min(300, val)));
                            }}
                            className="w-20 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-center text-sm font-bold text-slate-900 dark:text-white focus:border-blue-500 focus:outline-hidden"
                          />
                          <span className="text-xs font-medium text-slate-500">{t.welcome.customGoalUnit}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Complete Setup Button */}
          <div className="mt-6 pb-2">
            <button
              onClick={handleFinish}
              className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-sm font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{t.welcome.finishButton}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLanguageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#131D31] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t.settings.selectLanguageTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowLanguageModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {languageOptions.map(opt => {
                const isSelected = language === opt.code;
                return (
                  <button
                    key={opt.code}
                    onClick={() => handleSelectLanguage(opt.code)}
                    className={`flex w-full items-center justify-between rounded-2xl border p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold shadow-xs'
                        : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#131D31] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-left">
                      <span className="text-sm font-bold">{opt.nativeLabel}</span>
                      <span className="text-xs text-slate-400 font-normal">({opt.label})</span>
                    </div>

                    {isSelected ? (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="h-3 w-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-slate-300 dark:border-slate-700" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
