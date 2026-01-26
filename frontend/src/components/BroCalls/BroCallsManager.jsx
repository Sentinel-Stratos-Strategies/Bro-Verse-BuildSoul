import { useState, useEffect, useCallback } from 'react';
import BroCall from './BroCall';
import broCallMessages from '../../data/broCallMessages.json';

// Generate random duration between 7-10 seconds
function generateDuration() {
  return Math.floor(Math.random() * 4) + 7;
}

/**
 * BroCallsManager Component
 * Manages the delivery of 3 Bro Calls per week.
 * Calls appear at random times and disappear after 7-10 seconds.
 * Missed calls are gone forever.
 */
export function BroCallsManager({ userRoster = [], enabled = true }) {
  const [currentCall, setCurrentCall] = useState(null);
  const [callsThisWeek, setCallsThisWeek] = useState(0);
  const [lastCallTime, setLastCallTime] = useState(null);

  const CALLS_PER_WEEK = 3;
  const MIN_HOURS_BETWEEN_CALLS = 12;

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

  // Trigger a Bro Call
  const triggerBroCall = useCallback(() => {
    if (!enabled || callsThisWeek >= CALLS_PER_WEEK) return;

    const message = getRandomMessage();
    const character = getRandomCharacter();
    const duration = generateDuration();

    if (message) {
      setCurrentCall({ message: message.text, character, type: message.type, duration });
      setCallsThisWeek(prev => prev + 1);
      setLastCallTime(new Date());
    }
  }, [enabled, callsThisWeek, getRandomMessage, getRandomCharacter]);

  // Dismiss the current call
  const dismissCall = () => {
    setCurrentCall(null);
  };

  // Check if enough time has passed since last call
  const canTriggerCall = useCallback(() => {
    if (!lastCallTime) return true;
    const hoursSinceLastCall = (new Date() - lastCallTime) / (1000 * 60 * 60);
    return hoursSinceLastCall >= MIN_HOURS_BETWEEN_CALLS;
  }, [lastCallTime]);

  // Reset weekly counter every Monday
  useEffect(() => {
    const checkWeekReset = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const storedWeekStart = localStorage.getItem('broverse_week_start');
      
      if (!storedWeekStart || dayOfWeek === 1) { // Monday = 1
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - dayOfWeek + 1);
        weekStart.setHours(0, 0, 0, 0);
        
        const storedDate = storedWeekStart ? new Date(storedWeekStart) : null;
        if (!storedDate || storedDate < weekStart) {
          localStorage.setItem('broverse_week_start', weekStart.toISOString());
          setCallsThisWeek(0);
        }
      }
    };

    checkWeekReset();
    const interval = setInterval(checkWeekReset, 1000 * 60 * 60); // Check hourly
    return () => clearInterval(interval);
  }, []);

  // Random trigger mechanism (for demo - in production this would be server-driven)
  useEffect(() => {
    if (!enabled || callsThisWeek >= CALLS_PER_WEEK) return;

    // For demo: trigger after random delay (1-5 minutes)
    const delay = Math.floor(Math.random() * 4 * 60 * 1000) + 60 * 1000;
    
    const timeout = setTimeout(() => {
      if (canTriggerCall()) {
        triggerBroCall();
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [enabled, callsThisWeek, canTriggerCall, triggerBroCall]);

  return (
    <>
      {currentCall && (
        <BroCall
          message={currentCall.message}
          character={currentCall.character}
          duration={currentCall.duration}
          onDismiss={dismissCall}
        />
      )}
    </>
  );
}

export default BroCallsManager;
