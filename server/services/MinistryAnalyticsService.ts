export class MinistryAnalyticsService {
  /**
   * Generates a comprehensive structured text summary of the user's ministry progress
   */
  static generateUserProgressContext(userContext?: {
    stats?: any;
    entries?: any[];
    events?: any[];
    notes?: any[];
    settings?: any;
  }): string {
    if (!userContext) {
      return 'No Ministry Tracker data currently recorded.';
    }

    const { stats, entries = [], events = [], notes = [], settings = {} } = userContext;

    const publisherStatus = settings.publisherStatus || 'PUBLISHER';
    const customGoal = settings.customGoalHours || 0;
    
    // Monthly stats
    const monthlyMinutes = stats?.monthlyMinutes ?? entries.reduce((sum: number, e: any) => {
      const d = new Date(e.dateMillis);
      const now = new Date();
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        return sum + (e.durationMinutes || 0);
      }
      return sum;
    }, 0);

    const monthlyHours = (monthlyMinutes / 60).toFixed(1);
    const goalHours = stats?.goalHours ?? customGoal ?? 0;
    const remainingMinutes = Math.max(0, goalHours * 60 - monthlyMinutes);
    const remainingHours = (remainingMinutes / 60).toFixed(1);
    const progressPercent = goalHours > 0 ? Math.min(100, Math.round((monthlyMinutes / 60 / goalHours) * 100)) : 'N/A';

    const monthlyRVs = stats?.monthlyReturnVisits ?? 0;
    const monthlyStudies = stats?.monthlyBibleStudies ?? 0;
    const monthlyPlacements = stats?.monthlyPlacements ?? 0;
    const streakMonths = stats?.streakMonths ?? 0;

    // Recent 5 activity logs
    const recentEntries = [...entries]
      .sort((a, b) => (b.dateMillis || 0) - (a.dateMillis || 0))
      .slice(0, 5)
      .map(e => {
        const dateStr = new Date(e.dateMillis).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const hrs = ((e.durationMinutes || 0) / 60).toFixed(1);
        return `- ${dateStr}: ${hrs}h (${e.ministryType || 'Ministry'}) | Return Visits: ${e.returnVisits || 0}, Bible Studies: ${e.bibleStudies || 0}, Placements: ${e.placements || 0} ${e.notes ? `| Notes: "${e.notes}"` : ''}`;
      });

    // Upcoming scheduled events
    const upcomingEvents = [...events]
      .filter(e => e.dateMillis >= Date.now() - 86400000)
      .slice(0, 5)
      .map(e => {
        const dateStr = new Date(e.dateMillis).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `- ${dateStr}: "${e.title}" at ${e.location || 'N/A'}`;
      });

    // Territory & Notes Summary
    const territoryNotes = [...notes].filter((n: any) => !n.isDeleted && (n.noteType === 'TERRITORY' || n.noteType === 'HOUSE_LIST' || n.territoryName || (n.houses && n.houses.length > 0) || n.address || n.locationName));
    const territoriesSummary = territoryNotes.map((n: any) => {
      const name = n.territoryName || n.title || 'Territory';
      const loc = n.address || n.locationName ? `Address/Location: ${n.address || n.locationName}` : 'No saved address';
      const coords = n.latitude && n.longitude ? ` [Lat: ${n.latitude}, Lng: ${n.longitude}]` : '';
      const mapsUrl = n.googleMapsUrl ? ` | Google Maps Link: ${n.googleMapsUrl}` : (n.address ? ` | Google Maps Link: https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n.address)}` : '');
      const houseCount = n.houses ? n.houses.length : 0;
      const houseList = (n.houses || []).slice(0, 5).map((h: any) => {
        const hLoc = h.address || h.locationName ? ` (${h.address || h.locationName})` : '';
        return `    * House ${h.number}: Status ${h.status}${hLoc}`;
      }).join('\n');
      return `- ${name}: ${loc}${coords}${mapsUrl} | ${houseCount} house(s) recorded${houseList ? `\n${houseList}` : ''}`;
    });

    return `
USER MINISTRY TRACKER ACTUAL STORED DATA:
- Publisher Status: ${publisherStatus}
- Current Month Logged Hours: ${monthlyHours} hours
- Monthly Goal: ${goalHours > 0 ? `${goalHours} hours` : 'Flexible / No fixed target'}
- Goal Progress: ${goalHours > 0 ? `${progressPercent}%` : 'N/A'}
- Remaining Hours Needed: ${goalHours > 0 ? `${remainingHours} hours` : '0 hours'}
- Return Visits This Month: ${monthlyRVs}
- Bible Studies This Month: ${monthlyStudies}
- Literature Placements This Month: ${monthlyPlacements}
- Active Ministry Streak: ${streakMonths} consecutive month(s)
- Total Activity Entries Recorded: ${entries.length}

TERRITORIES & MAP LOCATIONS:
${territoriesSummary.length > 0 ? territoriesSummary.join('\n') : 'No territory map locations currently saved in Notes.'}

RECENT ACTIVITY LOGS:
${recentEntries.length > 0 ? recentEntries.join('\n') : 'No recent activity logged.'}

UPCOMING SCHEDULED ARRANGEMENTS:
${upcomingEvents.length > 0 ? upcomingEvents.join('\n') : 'No upcoming scheduled arrangements.'}
`.trim();
  }
}
