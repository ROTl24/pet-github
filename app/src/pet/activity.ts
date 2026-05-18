export type ActivitySession = {
  active: boolean;
  activeStartedAt: number | null;
  lastPulseAt: number | null;
  lastReminderAt: number | null;
};

export const activityConfig = {
  activeWindowMs: 30_000,
  workStartMs: 120_000,
  restReminderMs: 45 * 60_000,
  reminderCooldownMs: 20 * 60_000,
};

export function recordActivityPulse(session: ActivitySession, now: number): ActivitySession {
  return {
    ...session,
    active: true,
    activeStartedAt: session.activeStartedAt ?? now,
    lastPulseAt: now,
  };
}

export function expireActivity(session: ActivitySession, now: number): ActivitySession {
  if (!session.lastPulseAt || now - session.lastPulseAt <= activityConfig.activeWindowMs) {
    return session;
  }

  return {
    ...session,
    active: false,
    activeStartedAt: null,
  };
}

export function shouldEnterWorkMode(session: ActivitySession, now: number): boolean {
  if (!session.activeStartedAt) return false;
  return now - session.activeStartedAt >= activityConfig.workStartMs;
}

export function shouldShowRestReminder(session: ActivitySession, now: number): boolean {
  if (!session.activeStartedAt) return false;
  if (now - session.activeStartedAt < activityConfig.restReminderMs) return false;
  if (session.lastReminderAt && now - session.lastReminderAt < activityConfig.reminderCooldownMs) {
    return false;
  }

  return true;
}
