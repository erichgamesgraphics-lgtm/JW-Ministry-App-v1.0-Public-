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
  AlertTriangle,
  X,
  Target,
  FileSpreadsheet,
} from 'lucide-react';
import { useMinistry } from '../context/MinistryContext.tsx';
import { PublisherStatusType, PUBLISHER_STATUS_OPTIONS } from '../types.ts';
import { JWMinistryLogo } from '../components/JWMinistryLogo.tsx';

interface SettingsScreenProps {
  onShowWelcome?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const {
    settings,
    updateSettings,
    updatePublisherStatus,
    createBackup,
    restoreBackup,
    exportCsv,
    clearAllData,
  } = useMinistry();

  const [showGoalModal, setShowGoalModal] = useState<boolean>(false);
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
    showNotification(`Ministry goal updated to ${PUBLISHER_STATUS_OPTIONS[selectedGoal]?.displayName || 'Publisher'}`);
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
      showNotification('CSV ministry report downloaded successfully');
    } catch {
      showError('Failed to export CSV report');
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
      showNotification('Backup downloaded successfully');
    } catch {
      showError('Failed to generate backup file');
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
          showNotification('Backup data restored successfully!');
        } else {
          showError('Invalid or corrupted backup file format.');
        }
      } catch {
        showError('Could not parse the backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmClear = () => {
    clearAllData();
    setShowClearConfirm(false);
    showNotification('All ministry records have been cleared.');
  };

  const currentStatusInfo = PUBLISHER_STATUS_OPTIONS[settings.publisherStatus] || {
    displayName: 'Publisher',
    defaultGoalHours: 0,
    description: '',
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
    <div className="space-y-6 pb-28 max-w-lg mx-auto">
      {/* Top Title */}
      <div className="pt-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Settings
        </h1>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3.5 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
          <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Notification Alert */}
      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 p-3.5 text-xs font-semibold text-red-800 dark:text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 1: MINISTRY (AT THE TOP AS REQUESTED)                            */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ministry
          </h2>
        </div>

        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <Target className="h-3.5 w-3.5" />
                  {currentStatusInfo.displayName}
                </span>
                {settings.publisherStatus === 'CUSTOM' ? (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    ({settings.customGoalHours} hours/mo)
                  </span>
                ) : currentStatusInfo.defaultGoalHours > 0 ? (
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    ({currentStatusInfo.defaultGoalHours} hours/mo)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    (No fixed hours)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1 leading-snug">
                {currentStatusInfo.description}
              </p>
            </div>

            <button
              onClick={handleOpenGoalModal}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold px-3.5 py-2 transition-all cursor-pointer shadow-xs"
            >
              <span>Change Goal</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: APPEARANCE                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Appearance
        </h2>

        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-4 shadow-xs">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateSettings({ themeMode: 'LIGHT' })}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-xs font-semibold transition-all cursor-pointer ${
                settings.themeMode === 'LIGHT'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-2 border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Sun className="h-5 w-5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              onClick={() => updateSettings({ themeMode: 'DARK' })}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-xs font-semibold transition-all cursor-pointer ${
                settings.themeMode === 'DARK'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-2 border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Moon className="h-5 w-5 text-blue-400" />
              <span>Dark</span>
            </button>

            <button
              onClick={() => updateSettings({ themeMode: 'SYSTEM' })}
              className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-xs font-semibold transition-all cursor-pointer ${
                settings.themeMode === 'SYSTEM'
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-2 border-blue-600'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <Laptop className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <span>System</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: APP PREFERENCES                                                */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          App Preferences
        </h2>

        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-4">
          {/* Daily Reminder Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Daily Ministry Reminder
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Daily alert prompt to record time and return visits
              </p>
            </div>
            <button
              onClick={() => updateSettings({ dailyReminderEnabled: !settings.dailyReminderEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.dailyReminderEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.dailyReminderEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reminder Time Picker if enabled */}
          {settings.dailyReminderEnabled && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Reminder Time
              </span>
              <input
                type="time"
                value={`${settings.dailyReminderHour.toString().padStart(2, '0')}:${settings.dailyReminderMinute.toString().padStart(2, '0')}`}
                onChange={(e) => {
                  const [h, m] = e.target.value.split(':').map(Number);
                  updateSettings({ dailyReminderHour: h, dailyReminderMinute: m });
                }}
                className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Notifications Setting */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Arrangement Notifications
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reminders for scheduled preaching arrangements
              </p>
            </div>
            <button
              onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                settings.notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 4: DATA & BACKUP (AT THE BOTTOM AS REQUESTED)                     */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          Data & Backup
        </h2>

        <div className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#131D31] p-5 shadow-xs space-y-3">
          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Export CSV Report
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Export service entries for congregation reports or spreadsheets
                </p>
              </div>
            </div>
            <Download className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {/* Download JSON Backup */}
          <button
            onClick={handleDownloadBackup}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Download className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Download Full Backup File
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Save all entries, calendar arrangements, and preferences as JSON
                </p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {/* Restore JSON Backup */}
          <label className="flex w-full items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-3.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Restore from Backup File
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Import a previously exported JSON backup file
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
                    Clear All Ministry Data
                  </h3>
                  <p className="text-[11px] text-red-500/80 dark:text-red-400/80">
                    Delete all logged entries and calendar arrangements
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
            Ministry Tracker
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Version 2.0.0 • Offline Edition
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>All data stored securely on your local device</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* GOAL PICKER MODAL                                                         */}
      {/* ========================================================================= */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#131D31] shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Choose your ministry goal
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
                          Monthly Target (Hours):
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
                          <span className="text-xs font-medium text-slate-500">hours</span>
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
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Save Goal
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
                Clear All Ministry Data?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will permanently delete all your logged hours, return visits, Bible studies, and scheduled arrangements. This cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
