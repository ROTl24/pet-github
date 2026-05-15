import { describe, expect, it } from "vitest";

import {
  activityConfig,
  expireActivity,
  recordActivityPulse,
  shouldShowRestReminder,
  type ActivitySession,
} from "./activity";

describe("activity", () => {
  const inactiveSession: ActivitySession = {
    active: false,
    activeStartedAt: null,
    lastPulseAt: null,
    lastReminderAt: null,
  };

  it("records an activity pulse and keeps the first active timestamp", () => {
    const first = recordActivityPulse(inactiveSession, 1000);
    const second = recordActivityPulse(first, 2000);

    expect(second).toEqual({
      active: true,
      activeStartedAt: 1000,
      lastPulseAt: 2000,
      lastReminderAt: null,
    });
  });

  it("expires activity after the active window", () => {
    const active = recordActivityPulse(inactiveSession, 1000);

    expect(expireActivity(active, 1000 + activityConfig.activeWindowMs)).toBe(active);
    expect(expireActivity(active, 1001 + activityConfig.activeWindowMs)).toMatchObject({
      active: false,
      activeStartedAt: null,
    });
  });

  it("shows rest reminders after sustained activity and cooldown", () => {
    const session = {
      ...recordActivityPulse(inactiveSession, 1000),
      lastReminderAt: null,
    };

    expect(shouldShowRestReminder(session, 1000 + activityConfig.restReminderMs - 1)).toBe(false);
    expect(shouldShowRestReminder(session, 1000 + activityConfig.restReminderMs)).toBe(true);

    const reminded = { ...session, lastReminderAt: 1000 + activityConfig.restReminderMs };
    expect(
      shouldShowRestReminder(
        reminded,
        1000 + activityConfig.restReminderMs + activityConfig.reminderCooldownMs - 1,
      ),
    ).toBe(false);
    expect(
      shouldShowRestReminder(
        reminded,
        1000 + activityConfig.restReminderMs + activityConfig.reminderCooldownMs,
      ),
    ).toBe(true);
  });
});
