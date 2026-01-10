'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypewriterOptions {
  speed?: number; // milliseconds per character
  delay?: number; // delay before starting (ms)
  onComplete?: () => void;
}

/**
 * Custom hook for typewriter effect
 * Displays text character by character with configurable speed
 */
export function useTypewriter(
  text: string,
  options: UseTypewriterOptions = {}
): string {
  const { speed = 30, delay = 0, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const charIndexRef = useRef(0);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
    
    // Reset state
    setDisplayedText('');
    setIsComplete(false);
    charIndexRef.current = 0;
  }, []);

  useEffect(() => {
    // Reset when text changes
    reset();

    if (!text) {
      setIsComplete(true);
      return;
    }

    // Apply initial delay if specified
    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        startTyping();
      }, delay);
    } else {
      startTyping();
    }

    function startTyping() {
      if (charIndexRef.current < text.length) {
        timeoutRef.current = setTimeout(() => {
          const nextChar = text[charIndexRef.current];
          setDisplayedText((prev) => prev + nextChar);
          charIndexRef.current += 1;

          // Continue typing
          if (charIndexRef.current < text.length) {
            startTyping();
          } else {
            // Typing complete
            setIsComplete(true);
            if (onComplete) {
              onComplete();
            }
          }
        }, speed);
      }
    }

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [text, speed, delay, onComplete, reset]);

  return displayedText;
}

/**
 * Hook for typewriter effect with pause/play controls
 */
export function useTypewriterControl(
  text: string,
  options: UseTypewriterOptions = {}
) {
  const { speed = 30, delay = 0, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const charIndexRef = useRef(0);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pause = useCallback(() => {
    setIsPlaying(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    if (!isComplete && !isPlaying) {
      setIsPlaying(true);
      continueTyping();
    }
  }, [isComplete, isPlaying]);

  const reset = useCallback(() => {
    pause();
    setDisplayedText('');
    setIsComplete(false);
    charIndexRef.current = 0;
    setIsPlaying(true);
  }, [pause]);

  const continueTyping = useCallback(() => {
    if (!isPlaying || charIndexRef.current >= text.length) {
      return;
    }

    const nextChar = text[charIndexRef.current];
    setDisplayedText((prev) => prev + nextChar);
    charIndexRef.current += 1;

    if (charIndexRef.current < text.length) {
      timeoutRef.current = setTimeout(() => {
        continueTyping();
      }, speed);
    } else {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [text, speed, isPlaying, onComplete]);

  useEffect(() => {
    reset();

    if (!text) {
      setIsComplete(true);
      return;
    }

    if (delay > 0) {
      delayTimeoutRef.current = setTimeout(() => {
        if (isPlaying) {
          continueTyping();
        }
      }, delay);
    } else if (isPlaying) {
      continueTyping();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]); // Only reset on text change

  useEffect(() => {
    if (isPlaying && !isComplete && charIndexRef.current < text.length) {
      continueTyping();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, isComplete, text]);

  return {
    displayedText,
    isPlaying,
    isComplete,
    pause,
    play,
    reset,
  };
}
