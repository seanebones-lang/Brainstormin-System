/**
 * Input sanitization utilities using DOMPurify (isomorphic)
 * Prevents XSS, injection attacks, and validates input
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML string using DOMPurify
 * Safe for rendering in dangerouslySetInnerHTML
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Use DOMPurify to sanitize HTML, allowing only safe tags
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
}

/**
 * Sanitize user input for display (removes HTML tags, returns plain text)
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and return plain text
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
}

/**
 * Validate and sanitize topic input
 */
export function sanitizeTopic(input: string): string {
  if (typeof input !== 'string') {
    throw new Error('Topic must be a string');
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    throw new Error('Topic cannot be empty');
  }

  if (trimmed.length > 200) {
    throw new Error('Topic must be less than 200 characters');
  }

  // Use DOMPurify to sanitize
  return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Validate and sanitize style input
 */
export function sanitizeStyle(input: string | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  if (typeof input !== 'string') {
    throw new Error('Style must be a string');
  }

  const trimmed = input.trim();

  if (trimmed.length === 0) {
    return undefined;
  }

  if (trimmed.length > 100) {
    throw new Error('Style must be less than 100 characters');
  }

  // Use DOMPurify to sanitize
  return DOMPurify.sanitize(trimmed, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate session ID format
 */
export function isValidSessionId(sessionId: string): boolean {
  return isValidUUID(sessionId);
}

/**
 * Validate idea ID format
 */
export function isValidIdeaId(ideaId: string): boolean {
  return isValidUUID(ideaId);
}