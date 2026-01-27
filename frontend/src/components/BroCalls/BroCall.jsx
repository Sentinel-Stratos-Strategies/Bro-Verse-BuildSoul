import { useState, useEffect, useCallback, useRef } from 'react';
import './BroCall.css';

/**
 * BroCall Component
 * Displays an incoming call that must be answered, then an ephemeral message
 * that lasts 7-10 seconds and cannot be saved.
 * Once dismissed or timed out, the message is gone forever.
 */
export function BroCall({
  callId,
  message,
  character,
  mediaUrl,
  mediaType,
  onDismiss,
  onAnswered,
  onMissed,
  duration = 8
}) {
  const [phase, setPhase] = useState('ringing');
  const [timeLeft, setTimeLeft] = useState(duration);
  const [ringTimeLeft, setRingTimeLeft] = useState(10);
  const [isVisible, setIsVisible] = useState(true);
  const hasStartedRef = useRef(false);
  const ringStartedRef = useRef(false);
  const mediaRef = useRef(null);

  useEffect(() => {
    setPhase('ringing');
    setTimeLeft(duration);
    setRingTimeLeft(10);
    setIsVisible(true);
    hasStartedRef.current = false;
    ringStartedRef.current = false;
  }, [callId, duration]);

  // Handle dismiss with animation - wrapped in useCallback
  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    // Delay the actual dismiss for animation
    const timeout = setTimeout(() => {
      onDismiss?.();
    }, 300);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  const handleAnswer = () => {
    setPhase('connected');
    setTimeLeft(duration);
    onAnswered?.(callId);
  };

  const handleDecline = () => {
    onMissed?.(callId);
    handleDismiss();
  };

  // Ringing phase timer
  useEffect(() => {
    if (!message || ringStartedRef.current || phase !== 'ringing') return;
    ringStartedRef.current = true;

    const interval = setInterval(() => {
      setRingTimeLeft((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    const ringTimeout = setTimeout(() => {
      onMissed?.(callId);
      handleDismiss();
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(ringTimeout);
    };
  }, [message, phase, callId, onMissed, handleDismiss]);

  // Connected phase timer
  useEffect(() => {
    if (!message || hasStartedRef.current || phase !== 'connected') return;
    hasStartedRef.current = true;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const autoTimeout = setTimeout(() => {
      handleDismiss();
    }, duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(autoTimeout);
    };
  }, [message, duration, phase, handleDismiss]);

  // Auto-play media when connected
  useEffect(() => {
    if (phase !== 'connected' || !mediaUrl || !mediaRef.current) return;
    mediaRef.current.currentTime = 0;
    const playPromise = mediaRef.current.play?.();
    if (playPromise?.catch) {
      playPromise.catch(() => { });
    }
  }, [phase, mediaUrl, callId]);

  if (!message || !isVisible) return null;

  return (
    <div className={`bro-call ${phase} ${isVisible ? 'visible' : ''}`}>
      {phase === 'ringing' && (
        <div className="bro-call-incoming">
          <div className="bro-call-badge">Incoming Bro Call</div>
          <div className="bro-call-video">
            <div className="bro-call-video-inner">
              <div className="bro-call-avatar">{character?.name?.[0] || 'B'}</div>
              <div className="bro-call-name">{character?.name || 'The Universe'}</div>
              <div className="bro-call-subtitle">Live encouragement • 7-10 seconds</div>
            </div>
          </div>
          <div className="bro-call-ring-timer">{ringTimeLeft}s to answer</div>
          <div className="bro-call-actions">
            <button className="bro-call-btn decline" onClick={handleDecline}>Decline</button>
            <button className="bro-call-btn answer" onClick={handleAnswer}>Answer</button>
          </div>
          <div className="bro-call-footer">
            <span className="bro-call-warning">⚡ If you miss it, it disappears forever</span>
          </div>
        </div>
      )}

      {phase === 'connected' && (
        <div className="bro-call-content">
          {mediaUrl && (
            <div className="bro-call-media">
              {mediaType === 'audio' ? (
                <audio ref={mediaRef} src={mediaUrl} preload="auto" />
              ) : (
                <video
                  ref={mediaRef}
                  src={mediaUrl}
                  playsInline
                  preload="auto"
                  className="bro-call-media-video"
                />
              )}
            </div>
          )}
          <div className="bro-call-header">
            <span className="bro-call-character">{character?.name || 'The Universe'}</span>
            <span className="bro-call-timer">{timeLeft}s</span>
          </div>
          <p className="bro-call-message">{message}</p>
          <div className="bro-call-footer">
            <span className="bro-call-warning">⚡ This message will disappear forever</span>
          </div>
          <div className="bro-call-actions connected">
            <button className="bro-call-btn hangup" onClick={handleDismiss}>Hang up</button>
          </div>
        </div>
      )}

      {phase === 'connected' && (
        <div className="bro-call-progress">
          <div
            className="bro-call-progress-bar"
            style={{
              animationDuration: `${duration}s`,
              animationPlayState: 'running'
            }}
          />
        </div>
      )}
    </div>
  );
}

export default BroCall;
