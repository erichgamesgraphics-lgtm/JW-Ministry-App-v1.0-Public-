import React, { useState } from 'react';
import { Bell, X, Calendar as CalendarIcon } from 'lucide-react';
import { MinistryProvider, useMinistry } from './context/MinistryContext.tsx';
import { Header } from './components/Header.tsx';
import { Navigation, TabType } from './components/Navigation.tsx';
import { HomeScreen } from './screens/HomeScreen.tsx';
import { ActivityScreen } from './screens/ActivityScreen.tsx';
import { CalendarScreen } from './screens/CalendarScreen.tsx';
import { ReportsScreen } from './screens/ReportsScreen.tsx';
import { SettingsScreen } from './screens/SettingsScreen.tsx';
import { WelcomeScreen } from './screens/WelcomeScreen.tsx';
import { AddEditEntryModal } from './screens/AddEditEntryModal.tsx';
import { AddEditScheduleModal } from './screens/AddEditScheduleModal.tsx';
import { JWMinistryLogo } from './components/JWMinistryLogo.tsx';
import { MinistryEntry, ScheduledEvent, ExpandedCalendarEvent } from './types.ts';

const AppContent: React.FC = () => {
  const { settings, isLoaded, activeNotification, dismissActiveNotification } = useMinistry();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [manualWelcome, setManualWelcome] = useState<boolean>(false);

  // Modal states
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<MinistryEntry | null>(null);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<ScheduledEvent | ExpandedCalendarEvent | null>(null);
  const [initialScheduleDate, setInitialScheduleDate] = useState<Date | undefined>(undefined);

  const handleOpenNewEntry = () => {
    setEntryToEdit(null);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditEntry = (entry: MinistryEntry) => {
    setEntryToEdit(entry);
    setIsEntryModalOpen(true);
  };

  const handleCloseEntryModal = () => {
    setIsEntryModalOpen(false);
    setEntryToEdit(null);
  };

  const handleOpenNewSchedule = (date?: Date) => {
    setEventToEdit(null);
    setInitialScheduleDate(date || new Date());
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (event: ScheduledEvent | ExpandedCalendarEvent) => {
    setEventToEdit(event);
    setInitialScheduleDate(new Date(event.dateMillis));
    setIsScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setIsScheduleModalOpen(false);
    setEventToEdit(null);
    setInitialScheduleDate(undefined);
  };

  const handleFinishWelcome = () => {
    setManualWelcome(false);
  };

  // 1. Loading splash while storage state is loading - prevents race conditions
  if (!isLoaded) {
    const isArmenian = settings.language === 'hy';
    const isRussian = settings.language === 'ru';
    const isHindi = settings.language === 'hi';
    const isPunjabi = settings.language === 'pa';
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 select-none">
        <div className="flex flex-col items-center text-center space-y-4">
          <JWMinistryLogo size={80} className="rounded-3xl shadow-lg animate-pulse" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isArmenian
                ? 'Ծառայության Ծրագիր'
                : isRussian
                ? 'Служебный Дневник'
                : isHindi
                ? 'सेवकाई ट्रैकर'
                : isPunjabi
                ? 'ਸੇਵਕਾਈ ਟਰੈਕਰ'
                : 'Ministry Tracker'}
            </h2>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {isArmenian
                ? 'Բեռնվում է...'
                : isRussian
                ? 'Загрузка...'
                : isHindi
                ? 'लोड हो रहा है...'
                : isPunjabi
                ? 'ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...'
                : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Safe onboarding check: ONLY show welcome screen if manually requested OR if a truly brand-new installation
  const isFirstTimeUser = !settings.onboardingCompleted && settings.isFirstLaunch;
  const showWelcome = manualWelcome || isFirstTimeUser;

  if (showWelcome) {
    return <WelcomeScreen onContinue={handleFinishWelcome} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500/20">
      {/* Active In-App Notification Toast */}
      {activeNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top duration-300">
          <div className="rounded-2xl bg-amber-500 text-white p-4 shadow-xl flex items-start justify-between gap-3 border border-amber-400/50">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/20 p-2 mt-0.5 shrink-0">
                <Bell className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">
                  {activeNotification.title}
                </p>
                <p className="text-sm font-bold leading-snug">
                  {activeNotification.body}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setActiveTab('calendar');
                  dismissActiveNotification();
                }}
                className="rounded-lg bg-white/20 hover:bg-white/30 px-2.5 py-1 text-xs font-bold transition-colors cursor-pointer"
              >
                <CalendarIcon className="h-3.5 w-3.5 inline mr-1" />
                View
              </button>
              <button
                onClick={dismissActiveNotification}
                className="rounded-lg p-1 text-amber-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header onOpenNewEntry={handleOpenNewEntry} />

      {/* Main Screen Content */}
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-5 sm:px-6">
        {activeTab === 'home' && (
          <HomeScreen
            onOpenNewEntry={handleOpenNewEntry}
            onOpenEditEntry={handleOpenEditEntry}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'activity' && (
          <ActivityScreen
            onOpenNewEntry={handleOpenNewEntry}
            onOpenEditEntry={handleOpenEditEntry}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarScreen
            onOpenNewSchedule={handleOpenNewSchedule}
            onOpenEditSchedule={handleOpenEditSchedule}
          />
        )}
        {activeTab === 'reports' && <ReportsScreen />}
        {activeTab === 'settings' && (
          <SettingsScreen onShowWelcome={() => setManualWelcome(true)} />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewEntry={handleOpenNewEntry}
      />

      {/* Modals */}
      <AddEditEntryModal
        isOpen={isEntryModalOpen}
        onClose={handleCloseEntryModal}
        entryToEdit={entryToEdit}
      />

      <AddEditScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={handleCloseScheduleModal}
        eventToEdit={eventToEdit}
        initialDate={initialScheduleDate}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <MinistryProvider>
      <AppContent />
    </MinistryProvider>
  );
};

export default App;

