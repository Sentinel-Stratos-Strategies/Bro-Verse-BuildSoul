import { useState, useEffect, useCallback } from 'react';
import BroCall from './BroCall';
import broCallMessages from '../../data/broCallMessages.json';

// Generate random duration between 7-10 seconds
function generateDuration() {
  return Math.floor(Math.random() * 4) + 7;
}

const STORAGE_KEYS = {
  weekStart: 'broverse_bro_calls_week_start',
  schedule: 'broverse_bro_calls_schedule'
};

const CALLS_PER_WEEK = 3;
const EARLIEST_HOUR = 7; // 7 a.m.
const LATEST_HOUR = 22; // 10 p.m.
const CALL_WINDOW_SECONDS = 10;
const POLL_INTERVAL_MS = 15000;

function getWeekStart(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function generateScheduledTime(weekStart) {
  const scheduled = new Date(weekStart);
  const dayOffset = Math.floor(Math.random() * 7);
  const hour = Math.floor(Math.random() * (LATEST_HOUR - EARLIEST_HOUR + 1)) + EARLIEST_HOUR;
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  scheduled.setDate(weekStart.getDate() + dayOffset);
  scheduled.setHours(hour, minute, second, 0);
  return scheduled;
}

function generateSchedule(weekStart) {
  const schedule = [];
  const usedTimestamps = new Set();

  while (schedule.length < CALLS_PER_WEEK) {
    const scheduledAt = generateScheduledTime(weekStart);
    const timestamp = scheduledAt.getTime();
    if (usedTimestamps.has(timestamp)) continue;
    usedTimestamps.add(timestamp);
    schedule.push({
      id: schedule.length + 1,
      scheduledAt: scheduledAt.toISOString(),
      status: 'scheduled'
    });
  }

  return schedule.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

function loadSchedule() {
  const raw = localStorage.getItem(STORAGE_KEYS.schedule);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveSchedule(schedule, weekStart) {
  localStorage.setItem(STORAGE_KEYS.weekStart, weekStart.toISOString());
  localStorage.setItem(STORAGE_KEYS.schedule, JSON.stringify(schedule));
}

function reconcileSchedule(schedule, now = new Date()) {
  return schedule.map((entry) => {
    if (entry.status !== 'scheduled') return entry;
    const scheduledAt = new Date(entry.scheduledAt);
    const windowEnd = new Date(scheduledAt.getTime() + CALL_WINDOW_SECONDS * 1000);
    if (now > windowEnd) {
      return { ...entry, status: 'missed' };
    }
    return entry;
  });
}

/**
 * BroCallsManager Component
 * Manages the delivery of 3 Bro Calls per week.
 * Calls appear at random times between 7 a.m. and 10 p.m. and disappear after 7-10 seconds.
 * Missed calls are gone forever.
 */
export function BroCallsManager({ userRoster = [], enabled = true }) {
  const [currentCall, setCurrentCall] = useState(null);
  const [weeklySchedule, setWeeklySchedule] = useState([]);

  // Get a random message from the pool
  const getRandomMessage = useCallback(() => {
    const messages = broCallMessages?.messages || [];
    if (messages.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }, []);

  // Get a random character from user's roster
  const getRandomCharacter = useCallback(() => {
    if (userRoster.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * userRoster.length);
    return userRoster[randomIndex];
  }, [userRoster]);

  const ensureSchedule = useCallback(() => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const storedWeekStart = localStorage.getItem(STORAGE_KEYS.weekStart);
    let schedule = loadSchedule();

    if (!storedWeekStart || !schedule) {
      schedule = generateSchedule(weekStart);
      saveSchedule(schedule, weekStart);
      return schedule;
    }

    const storedDate = new Date(storedWeekStart);
    if (storedDate.getTime() !== weekStart.getTime()) {
      schedule = generateSchedule(weekStart);
      saveSchedule(schedule, weekStart);
      return schedule;
    }

    const reconciled = reconcileSchedule(schedule, now);
    if (JSON.stringify(reconciled) !== JSON.stringify(schedule)) {
      saveSchedule(reconciled, weekStart);
      return reconciled;
    }

    return schedule;
  }, []);

  const updateScheduleStatus = useCallback((scheduleId, status) => {
    const now = new Date();
    const weekStart = getWeekStart(now);
    const schedule = loadSchedule() || [];
    const updated = schedule.map((entry) =>
      entry.id === scheduleId ? { ...entry, status } : entry
    );
    saveSchedule(updated, weekStart);
    setWeeklySchedule(updated);
  }, []);

  // Dismiss the current call
  const dismissCall = () => {
    setCurrentCall(null);
  };

  // Initialize schedule for the week
  useEffect(() => {
    setWeeklySchedule(ensureSchedule());
  }, [ensureSchedule]);

  // Poll for scheduled calls and trigger when their window opens
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      const schedule = ensureSchedule();
      setWeeklySchedule(schedule);

      if (currentCall) return;

      const now = new Date();
      const pending = schedule.find((entry) => {
        if (entry.status !== 'scheduled') return false;
        const scheduledAt = new Date(entry.scheduledAt);
        const windowEnd = new Date(scheduledAt.getTime() + CALL_WINDOW_SECONDS * 1000);
        return now >= scheduledAt && now <= windowEnd;
      });

      if (!pending) return;

      const message = getRandomMessage();
      const character = getRandomCharacter();
      const duration = generateDuration();

      if (!message) return;

      setCurrentCall({
        id: pending.id,
        message: message.text,
        character,
        type: message.type,
        duration,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType
      });

      updateScheduleStatus(pending.id, 'ringing');
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled, currentCall, ensureSchedule, getRandomMessage, getRandomCharacter]);

  return (
    <>
      {currentCall && (
        <BroCall
          callId={currentCall.id}
          message={currentCall.message}
          character={currentCall.character}
          duration={currentCall.duration}
          mediaUrl={currentCall.mediaUrl}
          mediaType={currentCall.mediaType}
          onDismiss={dismissCall}
          onAnswered={() => updateScheduleStatus(currentCall.id, 'seen')}
          onMissed={() => updateScheduleStatus(currentCall.id, 'missed')}
        />
      )}
    </>
  );
}

export default BroCallsManager;
