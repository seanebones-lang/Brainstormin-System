/**
 * Input sanitization utilities
 * Prevents XSS, injection attacks, and validates input
 */

/**
 * Sanitize HTML string (basic XSS prevention)
 * For production, use DOMPurify or similar library
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Basic HTML entity encoding
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for display (removes HTML tags)
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags
  return input.replace(/<[^>]*>/g, '').trim();
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

  // Remove potentially dangerous characters but allow normal text
  // Allow: letters, numbers, spaces, common punctuation
  const sanitized = trimmed.replace(/[<>\"']/g, '');

  return sanitized;
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

  // Sanitize
  const sanitized = trimmed.replace(/[<>\"']/g, '');

  return sanitized;
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
