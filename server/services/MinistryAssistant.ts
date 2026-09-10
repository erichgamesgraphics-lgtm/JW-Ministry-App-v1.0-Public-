export interface ProgressAnalysisResult {
  currentMonthName: string;
  year: number;
  publisherStatus: string;
  goalHours: number;
  loggedHours: number;
  remainingHours: number;
  progressPercent: number;
  returnVisits: number;
  bibleStudies: number;
  placements: number;
  activeStreakMonths: number;
  daysInMonth: number;
  daysRemaining: number;
  isOnPace: boolean;
  isGoalReached: boolean;
  weeklyAvgNeeded: number;
}

export class MinistryAssistant {
  private static parseUserStats(userContext: any) {
    const { stats = {}, entries = [], events = [], settings = {} } = userContext || {};

    const publisherStatus = settings.publisherStatus || 'PUBLISHER';
    const customGoalHours = settings.customGoalHours || 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysRemaining = Math.max(1, daysInMonth - now.getDate() + 1);

    // Current month entries
    const currentEntries = entries.filter((e: any) => {
      if (!e.dateMillis) return false;
      const d = new Date(e.dateMillis);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });

    const currentMinutes = currentEntries.reduce((sum: number, e: any) => sum + (e.durationMinutes || 0), 0);
    const loggedHours = Number((currentMinutes / 60).toFixed(1));
    const goalHours = stats.goalHours ?? customGoalHours ?? 0;
    const remainingHours = goalHours > 0 ? Math.max(0, Number((goalHours - loggedHours).toFixed(1))) : 0;
    const progressPercent = goalHours > 0 ? Math.min(100, Math.round((loggedHours / goalHours) * 100)) : 0;

    const returnVisits = currentEntries.reduce((sum: number, e: any) => sum + (e.returnVisits || 0), 0);
    const bibleStudies = currentEntries.reduce((sum: number, e: any) => sum + (e.bibleStudies || 0), 0);
    const placements = currentEntries.reduce((sum: number, e: any) => sum + (e.placements || 0), 0);

    const isGoalReached = goalHours > 0 && loggedHours >= goalHours;
    const weeksRemaining = Math.max(0.5, daysRemaining / 7);
    const weeklyAvgNeeded = Number((remainingHours / weeksRemaining).toFixed(1));

    // Expected pace calculation
    const expectedPaceHours = (goalHours / daysInMonth) * now.getDate();
    const isOnPace = loggedHours >= expectedPaceHours || isGoalReached;

    const monthName = now.toLocaleString('en-US', { month: 'long' });

    return {
      monthName,
      monthIndex: currentMonth,
      year: currentYear,
      publisherStatus,
      goalHours,
      loggedHours,
      remainingHours,
      progressPercent,
      returnVisits,
      bibleStudies,
      placements,
      activeStreakMonths: stats.streakMonths ?? 0,
      entriesCount: currentEntries.length,
      daysInMonth,
      daysRemaining,
      isOnPace,
      isGoalReached,
      weeklyAvgNeeded,
      allEntries: entries,
      allEvents: events,
      allSettings: settings,
    };
  }

  /**
   * Format localized progress report
   */
  static getCurrentMinistryProgress(userContext: any, lang: string = 'en'): string {
    const data = this.parseUserStats(userContext);

    switch (lang) {
      case 'hy':
        return `**Ամսական Առաջընթաց (${data.monthName} ${data.year})**
• **Կարգավիճակ**: ${data.publisherStatus}
• **Գրանցված ժամեր**: **${data.loggedHours}** ժամ
• **Նպատակային ժամեր**: ${data.goalHours > 0 ? `${data.goalHours} ժամ` : 'Ազատ նպատակ'}
• **Մնացած ժամեր**: **${data.remainingHours}** ժամ
• **Առաջընթաց**: **${data.goalHours > 0 ? `${data.progressPercent}%` : 'N/A'}**
• **Վերայցելություններ**: ${data.returnVisits} | **Աստվածաշնչի ուսումնասիրություններ**: ${data.bibleStudies} | **Գրականություն**: ${data.placements}
• **Ակտիվության շարունակականություն**: ${data.activeStreakMonths} ամիս

${data.isGoalReached ? '🎉 **Շնորհավորում ենք։ Դուք հասել եք ձեր ամսական նպատակին։**' : `💡 *Ձեր նպատակին հասնելու համար մնացել է ${data.remainingHours} ժամ (${data.daysRemaining} օրում)։*`}`;

      case 'ru':
        return `**Прогресс Служения (${data.monthName} ${data.year})**
• **Статус**: ${data.publisherStatus}
• **Записано часов**: **${data.loggedHours}** ч.
• **Цель на месяц**: ${data.goalHours > 0 ? `${data.goalHours} ч.` : 'Гибкая цель'}
• **Осталось часов**: **${data.remainingHours}** ч.
• **Выполнение цели**: **${data.goalHours > 0 ? `${data.progressPercent}%` : 'N/A'}**
• **Повторные посещения**: ${data.returnVisits} | **Изучения Библии**: ${data.bibleStudies} | **Публикации**: ${data.placements}
• **Непрерывность**: ${data.activeStreakMonths} мес.

${data.isGoalReached ? '🎉 **Поздравляем! Вы достигли своей цели на этот месяц.**' : `💡 *Осталось ${data.remainingHours} ч. за ${data.daysRemaining} дн. до конца месяца.*`}`;

      case 'hi':
        return `**मासिक प्रचार प्रगति (${data.monthName} ${data.year})**
• **स्थिति**: ${data.publisherStatus}
• **दर्ज घंटे**: **${data.loggedHours}** घंटे
• **लक्ष्य**: ${data.goalHours > 0 ? `${data.goalHours} घंटे` : 'कोई निश्चित लक्ष्य नहीं'}
• **शेष घंटे**: **${data.remainingHours}** घंटे
• **प्रगति**: **${data.goalHours > 0 ? `${data.progressPercent}%` : 'N/A'}**
• **पुनः भेंट**: ${data.returnVisits} | **बाइबल अध्ययन**: ${data.bibleStudies} | **साहित्य वितरण**: ${data.placements}
• **सक्रिय स्ट्रीक**: ${data.activeStreakMonths} महीने

${data.isGoalReached ? '🎉 **बधाई हो! आपने इस महीने का अपना लक्ष्य पूरा कर लिया है।**' : `💡 *अपने लक्ष्य तक पहुँचने के लिए ${data.daysRemaining} दिनों में ${data.remainingHours} घंटे शेष हैं।*`}`;

      case 'pa':
        return `**ਮਹੀਨਾਵਾਰ ਪ੍ਰਚਾਰ ਦੀ ਤਰੱਕੀ (${data.monthName} ${data.year})**
• **ਸਥਿਤੀ**: ${data.publisherStatus}
• **ਦਰਜ ਕੀਤੇ ਘੰਟੇ**: **${data.loggedHours}** ਘੰਟੇ
• **ਨਿਸ਼ਾਨਾ**: ${data.goalHours > 0 ? `${data.goalHours} ਘੰਟੇ` : 'ਕੋਈ ਪੱਕਾ ਨਿਸ਼ਾਨਾ ਨਹੀਂ'}
• **ਬਾਕੀ ਘੰਟੇ**: **${data.remainingHours}** ਘੰਟੇ
• **ਤਰੱਕੀ**: **${data.goalHours > 0 ? `${data.progressPercent}%` : 'N/A'}**
• **ਮੁੜ-ਮੁਲਾਕਾਤਾਂ**: ${data.returnVisits} | **ਬਾਈਬਲ ਸਟੱਡੀਆਂ**: ${data.bibleStudies} | **ਸਾਹਿਤ**: ${data.placements}
• **ਸਟ੍ਰੀਕ**: ${data.activeStreakMonths} ਮਹੀਨੇ

${data.isGoalReached ? '🎉 **ਮੁਬਾਰਕਾਂ! ਤੁਸੀਂ ਇਸ ਮਹੀਨੇ ਦਾ ਆਪਣਾ ਨਿਸ਼ਾਨਾ ਪੂਰਾ ਕਰ ਲਿਆ ਹੈ।**' : `💡 *ਆਪਣੇ ਨਿਸ਼ਾਨੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ ${data.daysRemaining} ਦਿਨਾਂ ਵਿੱਚ ${data.remainingHours} ਘੰਟੇ ਬਾਕੀ ਹਨ।*`}`;

      default:
        return `**Current Ministry Progress (${data.monthName} ${data.year})**
• **Status**: ${data.publisherStatus}
• **Logged Hours**: **${data.loggedHours}** hrs
• **Monthly Goal**: ${data.goalHours > 0 ? `${data.goalHours} hrs` : 'Flexible / No fixed target'}
• **Remaining Hours**: **${data.remainingHours}** hrs
• **Progress**: **${data.goalHours > 0 ? `${data.progressPercent}%` : 'N/A'}**
• **Return Visits**: ${data.returnVisits} | **Bible Studies**: ${data.bibleStudies} | **Placements**: ${data.placements}
• **Streak**: ${data.activeStreakMonths} consecutive month(s)

${data.isGoalReached ? '🎉 **Congratulations! You have reached your monthly goal.**' : `💡 *You have ${data.remainingHours} hours remaining with ${data.daysRemaining} days left in the month.*`}`;
    }
  }

  /**
   * Get Remaining Hours
   */
  static getRemainingHours(userContext: any, lang: string = 'en'): string {
    const data = this.parseUserStats(userContext);

    if (data.goalHours <= 0) {
      return lang === 'hy' ? 'Դուք չունեք սահմանված ամսական նպատակ։ Կարող եք սահմանել այն Կարգավորումներում։'
        : lang === 'ru' ? 'У вас не установлена фиксированная цель на месяц. Вы можете настроить ее в Настройках.'
        : lang === 'hi' ? 'आपने कोई निश्चित मासिक लक्ष्य सेट नहीं किया है। आप इसे सेटिंग्स में सेट कर सकते हैं।'
        : lang === 'pa' ? 'ਤੁਸੀਂ ਕੋਈ ਪੱਕਾ ਮਹੀਨਾਵਾਰ ਨਿਸ਼ਾਨਾ ਸੈੱਟ ਨਹੀਂ ਕੀਤਾ ਹੈ।'
        : 'You have not set a fixed monthly target hours goal. You can set your goal in Settings.';
    }

    if (data.isGoalReached) {
      return lang === 'hy' ? `🎉 **Դուք արդեն հասել եք ձեր նպատակին (${data.goalHours} ժամ)։** Գրանցվել է ${data.loggedHours} ժամ։ Մնացել է 0 ժամ։`
        : lang === 'ru' ? `🎉 **Вы уже достигли своей цели (${data.goalHours} ч.)!** Записано: ${data.loggedHours} ч. Осталось: 0 ч.`
        : lang === 'hi' ? `🎉 **आपने अपना लक्ष्य (${data.goalHours} घंटे) पूरा कर लिया है!** दर्ज घंटे: ${data.loggedHours}। शेष: 0 घंटे।`
        : lang === 'pa' ? `🎉 **ਤੁਸੀਂ ਆਪਣਾ ਨਿਸ਼ਾਨਾ (${data.goalHours} ਘੰਟੇ) ਪੂਰਾ ਕਰ ਲਿਆ ਹੈ!** ਦਰਜ ਕੀਤੇ ਘੰਟੇ: ${data.loggedHours}। ਬਾਕੀ: 0 ਘੰਟੇ।`
        : `🎉 **Target Reached!** You have logged **${data.loggedHours}** hours out of your **${data.goalHours}** hour goal. You have **0** remaining hours needed.`;
    }

    switch (lang) {
      case 'hy':
        return `Ձեզ մնացել է **${data.remainingHours}** ժամ՝ ${data.goalHours} ժամի նպատակին հասնելու համար։\n• Գրանցված ժամեր՝ ${data.loggedHours} ժամ (${data.progressPercent}%)\n• Մնացած օրեր՝ ${data.daysRemaining} օր\n• Առաջարկվող շաբաթական ծավալ՝ ~${data.weeklyAvgNeeded} ժամ/շաբաթ։`;
      case 'ru':
        return `Вам осталось **${data.remainingHours}** ч. до достижения цели в ${data.goalHours} ч.\n• Записано: ${data.loggedHours} ч. (${data.progressPercent}%)\n• Осталось дней: ${data.daysRemaining}\n• Рекомендуемый темп: ~${data.weeklyAvgNeeded} ч./нед.`;
      case 'hi':
        return `आपको अपने ${data.goalHours} घंटे के लक्ष्य तक पहुँचने के लिए **${data.remainingHours}** घंटे शेष हैं।\n• दर्ज घंटे: ${data.loggedHours} (${data.progressPercent}%)\n• शेष दिन: ${data.daysRemaining}\n• अनुशंसित साप्ताहिक औसत: ~${data.weeklyAvgNeeded} घंटे/सप्ताह।`;
      case 'pa':
        return `ਤੁਹਾਨੂੰ ਆਪਣੇ ${data.goalHours} ਘੰਟੇ ਦੇ ਨਿਸ਼ਾਨੇ ਤੱਕ ਪਹੁੰਚਣ ਲਈ **${data.remainingHours}** ਘੰਟੇ ਬਾਕੀ ਹਨ।\n• ਦਰਜ ਕੀਤੇ ਘੰਟੇ: ${data.loggedHours} (${data.progressPercent}%)\n• ਬਾਕੀ ਦਿਨ: ${data.daysRemaining}\n• ਹਫ਼ਤਾਵਾਰ ਔਸਤ: ~${data.weeklyAvgNeeded} ਘੰਟੇ/ਹਫ਼ਤਾ।`;
      default:
        return `You have **${data.remainingHours}** hours remaining to reach your **${data.goalHours}** hour monthly goal.\n• Completed: **${data.loggedHours}** hrs (${data.progressPercent}%)\n• Days Remaining in Month: **${data.daysRemaining}** days\n• Recommended Weekly Pace: **~${data.weeklyAvgNeeded}** hrs/week.`;
    }
  }

  /**
   * Get Goal Information
   */
  static getMinistryGoal(userContext: any, lang: string = 'en'): string {
    const data = this.parseUserStats(userContext);
    return lang === 'hy'
      ? `**Ձեր Ծառայողական Կարգավիճակը և Նպատակը**\n• **Կարգավիճակ**՝ ${data.publisherStatus}\n• **Ամսական Նպատակային Ժամեր**՝ ${data.goalHours > 0 ? `${data.goalHours} ժամ` : 'Ազատ նպատակ'}`
      : lang === 'ru'
      ? `**Ваш Статус и Цель в Служении**\n• **Статус**: ${data.publisherStatus}\n• **Цель на месяц**: ${data.goalHours > 0 ? `${data.goalHours} ч.` : 'Гибкая цель'}`
      : lang === 'hi'
      ? `**आपकी प्रचार स्थिति और लक्ष्य**\n• **स्थिति**: ${data.publisherStatus}\n• **मासिक लक्ष्य**: ${data.goalHours > 0 ? `${data.goalHours} घंटे` : 'कोई निश्चित लक्ष्य नहीं'}`
      : lang === 'pa'
      ? `**ਤੁਹਾਡੀ ਪ੍ਰਚਾਰ ਸਥਿਤੀ ਅਤੇ ਨਿਸ਼ਾਨਾ**\n• **ਸਥਿਤੀ**: ${data.publisherStatus}\n• **ਮਹੀਨਾਵਾਰ ਨਿਸ਼ਾਨਾ**: ${data.goalHours > 0 ? `${data.goalHours} ਘੰਟੇ` : 'ਕੋਈ ਪੱਕਾ ਨਿਸ਼ਾਨਾ ਨਹੀਂ'}`
      : `**Your Ministry Status & Goal Settings**\n• **Status**: ${data.publisherStatus}\n• **Monthly Target Goal**: ${data.goalHours > 0 ? `${data.goalHours} hrs/month` : 'Flexible / Custom Goal'}`;
  }

  /**
   * Get Activity History
   */
  static getActivityHistory(userContext: any, limit: number = 5, lang: string = 'en'): string {
    const data = this.parseUserStats(userContext);
    const entries = [...data.allEntries].sort((a: any, b: any) => (b.dateMillis || 0) - (a.dateMillis || 0)).slice(0, limit);

    if (entries.length === 0) {
      return lang === 'hy' ? 'Դեռևս ծառայության գրանցումներ առկա չեն։'
        : lang === 'ru' ? 'Записи служения пока отсутствуют.'
        : lang === 'hi' ? 'अभी तक कोई प्रचार गतिविधि दर्ज नहीं की गई है।'
        : lang === 'pa' ? 'ਅਜੇ ਤੱਕ ਕੋਈ ਪ੍ਰਚਾਰ ਗਤੀਵਿਧੀ ਦਰਜ ਨਹੀਂ ਕੀਤੀ ਗਈ।'
        : 'No ministry activity records found in the app yet.';
    }

    const formatted = entries.map((e: any) => {
      const dateStr = new Date(e.dateMillis).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const hrs = Number(((e.durationMinutes || 0) / 60).toFixed(1));
      return `- **${dateStr}**: ${hrs}h (${e.ministryType || 'Ministry'}) | RVs: ${e.returnVisits || 0}, Studies: ${e.bibleStudies || 0}, Placements: ${e.placements || 0}${e.notes ? ` | *"<sup>${e.notes}</sup>"*` : ''}`;
    }).join('\n');

    return `**Recent Activity Records (${entries.length})**\n${formatted}`;
  }

  /**
   * Get Ministry Schedule
   */
  static getMinistrySchedule(userContext: any, lang: string = 'en'): string {
    const data = this.parseUserStats(userContext);
    const events = [...data.allEvents].filter((e: any) => e.dateMillis >= Date.now() - 86400000).sort((a: any, b: any) => (a.dateMillis || 0) - (b.dateMillis || 0));

    if (events.length === 0) {
      return lang === 'hy' ? 'Առաջիկա ծառայողական պայմանավորվածություններ չկան։'
        : lang === 'ru' ? 'Предстоящие графики и встречи для служения отсутствуют.'
        : lang === 'hi' ? 'कोई आगामी प्रचार व्यवस्था निर्धारित नहीं है।'
        : lang === 'pa' ? 'ਕੋਈ ਆਉਣ ਵਾਲਾ ਪ੍ਰਚਾਰ ਪ੍ਰਬੰਧ ਨਹੀਂ ਹੈ।'
        : 'No upcoming scheduled ministry arrangements found in your calendar.';
    }

    const formatted = events.slice(0, 5).map((e: any) => {
      const dateStr = new Date(e.dateMillis).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `- 📅 **${dateStr}**: **${e.title}** ${e.location ? `at ${e.location}` : ''}`;
    }).join('\n');

    return `**Upcoming Scheduled Arrangements**\n${formatted}`;
  }

  /**
   * Generate Ministry Practical Tips & Analysis
   */
  static generateMinistryTips(userContext: any, lang: string = 'en'): string {
    const data = this.parseUserStats(userContext);

    let tipText = '';

    if (data.goalHours <= 0) {
      tipText = 'Consider setting a specific target hour goal in Settings to help track your monthly activity systematically.';
    } else if (data.isGoalReached) {
      tipText = `Great job reaching your ${data.goalHours} hour goal! You can use remaining days in the month for informal witnessing, return visits, or assisting others.`;
    } else if (data.isOnPace) {
      tipText = `You are currently on pace to reach your ${data.goalHours} hour goal! Keep up your steady schedule of ~${data.weeklyAvgNeeded} hours per week.`;
    } else {
      tipText = `You have ${data.remainingHours} hours remaining with ${data.daysRemaining} days left in the month. Scheduling short 1-2 hour witnessing periods during weekends or evenings can help you reach your goal smoothly.`;
    }

    switch (lang) {
      case 'hy':
        return `**Ծառայողական Խորհուրդներ և Անալիզ**\n• ${tipText}`;
      case 'ru':
        return `**Практические Советы по Служению**\n• ${tipText}`;
      case 'hi':
        return `**व्यावहारिक प्रचार सुझाव**\n• ${tipText}`;
      case 'pa':
        return `**ਪ੍ਰਚਾਰ ਸੁਝਾਅ**\n• ${tipText}`;
      default:
        return `**Practical Ministry Tips & Progress Analysis**\n• ${tipText}`;
    }
  }
}
