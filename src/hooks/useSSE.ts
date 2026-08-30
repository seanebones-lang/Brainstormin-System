'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSSEOptions {
  url: string;
  body?: Record<string, unknown>;
  headers?: Record<string, string>;
  onMessage?: (data: unknown) => void;
  onError?: (error: Error) => void;
  onOpen?: () => void;
  onClose?: () => void;
  retry?: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  };
}

interface SSEState {
  isConnected: boolean;
  error: Error | null;
  lastEvent: MessageEvent | null;
}

export function useSSE(options: UseSSEOptions) {
  const {
    url,
    onMessage,
    onError,
    onOpen,
    onClose,
    retry = {},
  } = options;

  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = retry;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    error: null,
    lastEvent: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!isMountedRef.current) return;

    // Create abort controller for this connection attempt
    abortControllerRef.current = new AbortController();

    try {
      const eventSource = new EventSource(url, {
        // Note: EventSource doesn't support custom headers or POST body directly
        // For POST with custom headers, we'd need a fetch-based implementation
      });

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        if (!isMountedRef.current) {
          eventSource.close();
          return;
        }
        retryCountRef.current = 0;
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        onOpen?.();
      };

      eventSource.onmessage = (event) => {
        if (!isMountedRef.current) return;
        
        let data: unknown;
        try {
          data = JSON.parse(event.data);
        } catch {
          data = event.data;
        }
        
        setState(prev => ({ ...prev, lastEvent: event }));
        onMessage?.(data);
      };

      eventSource.onerror = () => {
        if (!isMountedRef.current) return;

        const error = new Error('SSE connection error');
        setState(prev => ({ ...prev, isConnected: false, error }));
        onError?.(error);

        eventSource.close();

        // Retry logic with exponential backoff
        if (retryCountRef.current < maxRetries) {
          const delay = Math.min(
            baseDelay * Math.pow(backoffMultiplier, retryCountRef.current),
            maxDelay
          );
          
          // eslint-disable-next-line no-console
          console.log(`SSE reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
          
          setTimeout(() => {
            retryCountRef.current += 1;
            connect();
          }, delay);
        } else {
          // eslint-disable-next-line no-console
          console.error('SSE max retries exceeded');
          onClose?.();
        }
      };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to create EventSource:', error);
      onError?.(error as Error);
    }
  }, [url, maxRetries, baseDelay, maxDelay, backoffMultiplier, onMessage, onError, onOpen, onClose]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [connect]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    connect();
  }, [connect]);

  // Manual disconnect function
  const disconnect = useCallback(() => {
    retryCountRef.current = maxRetries; // Prevent auto-reconnect
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, [maxRetries]);

  return {
    ...state,
    reconnect,
    disconnect,
  };
}

/**
 * SSE hook using fetch API (supports POST, custom headers, and body)
 * Use this when you need to send data to the server to initiate the stream
 */
export function useSSEFetch(options: UseSSEOptions) {
  const {
    url,
    body,
    headers = {},
    onMessage,
    onError,
    onOpen,
    onClose,
    retry = {},
  } = options;

  const {
    maxRetries = 5,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
  } = retry;

  const [state, setState] = useState<SSEState>({
    isConnected: false,
    error: null,
    lastEvent: null,
  });

  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const decoderRef = useRef(new TextDecoder());

  const connect = useCallback(async () => {
    if (!isMountedRef.current) return;

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      retryCountRef.current = 0;
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      onOpen?.();

      readerRef.current = response.body.getReader();

      // Read the stream
      let buffer = '';
      while (isMountedRef.current) {
        const { done, value } = await readerRef.current.read();
        
        if (done) break;
        if (!value) continue;

        buffer += decoderRef.current.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            try {
              const data = JSON.parse(dataStr);
              const event = new MessageEvent('message', { data: dataStr });
              setState(prev => ({ ...prev, lastEvent: event }));
              onMessage?.(data);
            } catch {
              // If not JSON, pass raw string
              const event = new MessageEvent('message', { data: dataStr });
              setState(prev => ({ ...prev, lastEvent: event }));
              onMessage?.(dataStr);
            }
          }
        }
      }

      // Stream ended
      if (isMountedRef.current) {
        onClose?.();
        setState(prev => ({ ...prev, isConnected: false }));
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      const fetchError = error as Error;
      
      // Don't treat abort as error
      if (fetchError.name === 'AbortError') {
        return;
      }

      // eslint-disable-next-line no-console
      console.error('SSE fetch error:', fetchError);
      setState(prev => ({ ...prev, isConnected: false, error: fetchError }));
      onError?.(fetchError);

      // Retry logic with exponential backoff
      if (retryCountRef.current < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(backoffMultiplier, retryCountRef.current),
          maxDelay
        );
        
        // eslint-disable-next-line no-console
        console.log(`SSE fetch reconnecting in ${delay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
        
        setTimeout(() => {
          retryCountRef.current += 1;
          connect();
        }, delay);
      } else {
        // eslint-disable-next-line no-console
        console.error('SSE fetch max retries exceeded');
        onClose?.();
      }
    }
  }, [url, body, headers, maxRetries, baseDelay, maxDelay, backoffMultiplier, onMessage, onError, onOpen, onClose]);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (readerRef.current) {
        readerRef.current.cancel();
        readerRef.current = null;
      }
    };
  }, [connect]);

  const reconnect = useCallback(() => {
    retryCountRef.current = 0;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    connect();
  }, [connect]);

  const disconnect = useCallback(() => {
    retryCountRef.current = maxRetries;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    setState(prev => ({ ...prev, isConnected: false }));
  }, [maxRetries]);

  return {
    ...state,
    reconnect,
    disconnect,
  };
}