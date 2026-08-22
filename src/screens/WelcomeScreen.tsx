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
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { JWMinistryLogo } from '../components/JWMinistryLogo.tsx';
import { PublisherStatusType, PUBLISHER_STATUS_OPTIONS } from '../types.ts';

interface WelcomeScreenProps {
  onContinue: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  const { completeOnboarding } = useMinistry();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedGoal, setSelectedGoal] = useState<PublisherStatusType>('PUBLISHER');
  const [customHours, setCustomHours] = useState<number>(40);

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
      title: 'Publisher',
      badge: 'Standard',
      icon: BookOpen,
      iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60',
      description: PUBLISHER_STATUS_OPTIONS.PUBLISHER.description,
      targetText: 'Flexible / Track Monthly Activity',
    },
    {
      id: 'AUXILIARY_PIONEER' as PublisherStatusType,
      title: 'Auxiliary Pioneer',
      badge: '30 Hours',
      icon: Flame,
      iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
      description: PUBLISHER_STATUS_OPTIONS.AUXILIARY_PIONEER.description,
      targetText: 'Goal: 30 hours per month',
    },
    {
      id: 'PIONEER' as PublisherStatusType,
      title: 'Pioneer',
      badge: '50 Hours',
      icon: Award,
      iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60',
      description: PUBLISHER_STATUS_OPTIONS.PIONEER.description,
      targetText: 'Goal: 50 hours per month',
    },
    {
      id: 'SPECIAL_PIONEER' as PublisherStatusType,
      title: 'Special Pioneer',
      badge: '100 Hours',
      icon: Crown,
      iconColor: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60',
      description: PUBLISHER_STATUS_OPTIONS.SPECIAL_PIONEER.description,
      targetText: 'Goal: 100 hours per month',
    },
    {
      id: 'CUSTOM' as PublisherStatusType,
      title: 'Custom',
      badge: 'Flexible Goal',
      icon: Sliders,
      iconColor: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60',
      description: PUBLISHER_STATUS_OPTIONS.CUSTOM.description,
      targetText: 'Set your own target hours',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-[#0B1120] dark:via-[#0E1729] dark:to-[#131D31] text-slate-900 dark:text-white flex flex-col justify-between p-4 sm:p-6 md:p-8">
      {step === 1 ? (
        /* STEP 1: WELCOME & FEATURE OVERVIEW */
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between">
          <div className="pt-4 sm:pt-8 text-center">
            <div className="flex justify-center">
              <JWMinistryLogo size={88} className="rounded-3xl shadow-lg" />
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Private & Local On-Device Storage</span>
            </div>

            <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Ministry Tracker
            </h1>

            <p className="mt-2 text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed px-2">
              A clean, purposeful tool for Jehovah's Witnesses to record service activity, organize return visits, and track ministry goals.
            </p>

            {/* Feature Cards */}
            <div className="mt-6 space-y-2.5 text-left">
              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Activity & Live Stopwatch
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Log hours, return visits, Bible studies, and literature with an automatic stopwatch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <Target className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Ministry Goals & Progress
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Track progress toward Publisher, Auxiliary Pioneer, Pioneer, or Custom hour goals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CalendarIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Arrangements Calendar
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Plan preaching days, set reminder notifications, and schedule service partnerships.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-[#131D31]/80 p-3.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Monthly Reports & Backup
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    One-tap report sharing, CSV export for congregation records, and full local backup.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Button */}
          <div className="mt-8 pb-4">
            <button
              onClick={() => setStep(2)}
              className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-base font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
            >
              <span>NEXT</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        /* STEP 2: CHOOSE YOUR MINISTRY GOAL */
        <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between">
          <div className="pt-2 sm:pt-4">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setStep(1)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131D31] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Back to previous screen"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Step 2 of 2</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Choose your ministry goal
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
              Select the ministry arrangement or goal you are working toward. You can change this at any time in Settings.
            </p>

            {/* Goal Selection Cards */}
            <div className="mt-5 space-y-2.5">
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
                          Monthly Target (Hours):
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
                          <span className="text-xs font-medium text-slate-500">hours</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Complete Setup Button */}
          <div className="mt-6 pb-4">
            <button
              onClick={handleFinish}
              className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-base font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Finish Setup & Enter App</span>
              <CheckCircle2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
