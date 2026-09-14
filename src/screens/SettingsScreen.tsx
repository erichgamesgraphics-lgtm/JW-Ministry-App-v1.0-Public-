import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Laptop,
  Download,
  Upload,
  Check,
  Trash2,
  BookOpen,
  Flame,
  Award,
  Crown,
  Sliders,
  ChevronRight,
  ShieldCheck,
  X,
  Target,
  FileSpreadsheet,
  Globe,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { PublisherStatusType, SupportedLanguage } from '../types.ts';
import { JWMinistryLogo } from '../components/JWMinistryLogo.tsx';

interface SettingsScreenProps {
  onShowWelcome?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onShowWelcome }) => {
  const {
    settings,
    updatePublisherStatus,
    updateTheme,
    updateLanguage,
    createBackup,
    restoreBackup,
    exportCsv,
    clearAllData,
    language,
    t,
  } = useMinistry();

  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
  const [showLanguageModal, setShowLanguageModal] = useState<boolean>(false);
  const [selectedGoal, setSelectedGoal] = useState<PublisherStatusType>(settings.publisherStatus);
  const [customGoalInput, setCustomGoalInput] = useState<number>(settings.customGoalHours || 50);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const handleOpenGoalModal = () => {
    setSelectedGoal(settings.publisherStatus);
    setCustomGoalInput(settings.customGoalHours || 50);
    setShowGoalModal(true);
  };

  const handleSaveGoal = () => {
    let finalCustom = customGoalInput;
    if (selectedGoal === 'CUSTOM') {
      if (isNaN(finalCustom) || finalCustom <= 0) {
        finalCustom = 40;
      }
    }
    updatePublisherStatus(selectedGoal, selectedGoal === 'CUSTOM' ? finalCustom : undefined);
    setShowGoalModal(false);
    showNotification(t.settings.goalUpdated);
  };

  const handleExportCsv = () => {
    try {
      const csv = exportCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ministry_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(t.settings.csvExportSuccess);
    } catch {
      showError(t.settings.csvExportFailed);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const json = createBackup();
      const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `ministry_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification(t.settings.backupSuccess);
    } catch {
      showError(t.settings.backupFailed);
    }
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const success = restoreBackup(content);
        if (success) {
          showNotification(t.settings.restoreSuccess);
        } else {
          showError(t.settings.restoreCorrupted);
        }
      } catch {
        showError(t.settings.restoreInvalid);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmClear = () => {
    clearAllData();
    setShowClearConfirm(false);
    showNotification(t.settings.clearSuccess);
  };

  const handleSelectLanguage = (langCode: SupportedLanguage) => {
    updateLanguage(langCode);
    setShowLanguageModal(false);
  };

  const getStatusDisplayName = () => {
    switch (settings.publisherStatus) {
      case 'PUBLISHER':
        return t.goals.publisher;
      case 'AUXILIARY_PIONEER':
      case 'AUXILIARY_PIONEER_15':
      case 'AUXILIARY_PIONEER_30':
        return t.goals.auxiliaryPioneer;
      case 'PIONEER':
      case 'REGULAR_PIONEER_50':
        return t.goals.pioneer;
      case 'SPECIAL_PIONEER':
      case 'SPECIAL_PIONEER_100':
        return t.goals.specialPioneer;
      case 'CUSTOM':
        return t.goals.custom;
      default:
        return t.goals.publisher;
    }
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

  const languageOptions: Array<{ code: SupportedLanguage; label: string; nativeLabel: string }> = [
    { code: 'en', label: 'English', nativeLabel: 'English' },
    { code: 'hy', label: 'Armenian', nativeLabel: 'Հայերեն' },
    { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
    { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  ];

  const currentLanguageObj = languageOptions.find(l => l.code === language) || languageOptions[0];

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto">
      {/* Title */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {t.settings.title}
        </h1>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/60 p-3 text-xs sm:text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/60 p-3 text-xs sm:text-sm font-semibold text-red-800 dark:text-red-200 flex items-center gap-2">
          <X className="h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: LANGUAGE (AT THE TOP AS REQUESTED)                             */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.settings.sectionLanguage}
            </h2>
          </div>
        </div>

        <button
          onClick={() => setShowLanguageModal(true)}
          className="flex w-full items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t.settings.languageLabel}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentLanguageObj.nativeLabel} ({currentLanguageObj.label})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span>{currentLanguageObj.nativeLabel}</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: MINISTRY GOALS                                                 */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.settings.sectionMinistryGoal}
            </h2>
          </div>
        </div>

        <div
          onClick={handleOpenGoalModal}
          className="flex items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-3.5 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {getStatusDisplayName()}
                </h3>
                {settings.publisherStatus === 'CUSTOM' && (
                  <span className="rounded-md bg-blue-100 dark:bg-blue-950 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    {settings.customGoalHours} {t.common.hoursShort}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t.settings.tapToChangeGoal}
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: APPEARANCE                                                     */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.settings.sectionAppearance}
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'SYSTEM' as const, label: t.header.themeSystem, icon: Laptop },
            { id: 'LIGHT' as const, label: t.header.themeLight, icon: Sun },
            { id: 'DARK' as const, label: t.header.themeDark, icon: Moon },
          ].map(themeOpt => {
            const Icon = themeOpt.icon;
            const isSelected = settings.themeMode === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                onClick={() => updateTheme(themeOpt.id)}
                className={`flex flex-col items-center justify-center rounded-2xl border p-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Icon className="h-4 w-4 mb-1.5" />
                <span className="text-xs">{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: DATA & BACKUP                                                  */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t.settings.sectionDataBackup}
        </h2>

        <div className="space-y-2">
          {/* Export to CSV */}
          <button
            onClick={handleExportCsv}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.settings.exportCsvTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.settings.exportCsvDesc}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {/* Download JSON Backup */}
          <button
            onClick={handleDownloadBackup}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.settings.exportJsonTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.settings.exportJsonDesc}
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {/* Restore JSON Backup */}
          <label className="flex w-full items-center justify-between rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-3.5 hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t.settings.restoreJsonTitle}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t.settings.restoreJsonDesc}
                </p>
              </div>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </label>

          {/* Clear All Records */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-red-100 dark:border-red-950 bg-red-50/50 dark:bg-red-950/20 p-3.5 hover:bg-red-100/60 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-red-600 dark:text-red-400">
                    {t.settings.clearDataTitle}
                  </h3>
                  <p className="text-[11px] text-red-500/80 dark:text-red-400/80">
                    {t.settings.clearDataDesc}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-red-400 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 5: ABOUT                                                          */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs text-center space-y-3">
        <div className="flex justify-center">
          <JWMinistryLogo size={44} className="rounded-2xl" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {t.common.appName}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.settings.aboutVersion}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{t.settings.aboutSecure}</span>
        </div>

        {onShowWelcome && (
          <div className="pt-2">
            <button
              onClick={onShowWelcome}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {language === 'hy' ? 'Դիտել Ողջույնի Էջը' : language === 'ru' ? 'Открыть страницу приветствия' : 'View Welcome Screen'}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LANGUAGE SELECTION MODAL                                                  */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* GOAL PICKER MODAL                                                         */}
      {/* ========================================================================= */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#131D31] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {t.welcome.step2Title}
              </h3>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {goalCards.map((card) => {
                const IconComponent = card.icon;
                const isSelected = selectedGoal === card.id;

                return (
                  <div
                    key={card.id}
                    onClick={() => setSelectedGoal(card.id)}
                    className={`rounded-2xl border-2 p-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 dark:border-blue-500 shadow-xs'
                        : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#131D31] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.iconColor}`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {card.title}
                            </span>
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

                    {/* Custom Hours Input inside modal */}
                    {card.id === 'CUSTOM' && isSelected && (
                      <div className="mt-3 pt-3 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between gap-3">
                        <label htmlFor="settings-custom-goal-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {t.welcome.customGoalLabel}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            id="settings-custom-goal-input"
                            type="number"
                            min="1"
                            max="300"
                            value={customGoalInput || ''}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              setCustomGoalInput(isNaN(val) ? 0 : Math.max(1, Math.min(300, val)));
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

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowGoalModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {t.common.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLEAR ALL DATA CONFIRMATION MODAL                                         */}
      {/* ========================================================================= */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#131D31] p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.settings.clearConfirmTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.settings.clearConfirmDesc}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {t.settings.clearConfirmButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
