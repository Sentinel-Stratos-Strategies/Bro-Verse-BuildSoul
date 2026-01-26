import { useState, useEffect, useCallback, useRef } from 'react';
import './BroCall.css';

/**
 * BroCall Component
 * Displays ephemeral messages that last 7-10 seconds and cannot be saved.
 * Once dismissed or timed out, the message is gone forever.
 */
export function BroCall({ message, character, onDismiss, duration = 8 }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isVisible, setIsVisible] = useState(true);
  const hasStartedRef = useRef(false);

  // Handle dismiss with animation - wrapped in useCallback
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    // Delay the actual dismiss for animation
    const timeout = setTimeout(() => {
      onDismiss?.();
    }, 300);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  // Timer effect - runs once on mount
  useEffect(() => {
    if (!message || hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Countdown timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Auto-dismiss after duration
    const autoTimeout = setTimeout(() => {
      handleDismiss();
    }, duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(autoTimeout);
    };
  }, [message, duration, handleDismiss]);

  if (!message || !isVisible) return null;

  return (
    <div className={`bro-call ${isVisible ? 'visible' : ''}`}>
      <div className="bro-call-content">
        <div className="bro-call-header">
          <span className="bro-call-character">{character?.name || 'The Universe'}</span>
          <span className="bro-call-timer">{timeLeft}s</span>
        </div>
        <p className="bro-call-message">{message}</p>
        <div className="bro-call-footer">
          <span className="bro-call-warning">⚡ This message will disappear forever</span>
        </div>
      </div>
      <div className="bro-call-progress">
        <div 
          className="bro-call-progress-bar" 
          style={{ 
            animationDuration: `${duration}s`,
            animationPlayState: 'running'
          }} 
        />
      </div>
    </div>
  );
}

export default BroCall;
