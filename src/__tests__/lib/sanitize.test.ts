import { describe, it, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeTopic,
  sanitizeStyle,
  isValidUUID,
  isValidSessionId,
  isValidIdeaId,
} from '@/lib/sanitize';

describe('Sanitization Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should escape HTML entities', () => {
      expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    it('should handle empty strings', () => {
      expect(sanitizeHtml('')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeHtml(null as unknown as string)).toBe('');
      expect(sanitizeHtml(123 as unknown as string)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should remove HTML tags', () => {
      expect(sanitizeText('<p>Hello</p>')).toBe('Hello');
    });

    it('should trim whitespace', () => {
      expect(sanitizeText('  Hello World  ')).toBe('Hello World');
    });
  });

  describe('sanitizeTopic', () => {
    it('should sanitize valid topic', () => {
      expect(sanitizeTopic('AI for retail')).toBe('AI for retail');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeTopic('AI <script>for</script> retail')).toBe('AI scriptfor/script retail');
    });

    it('should throw on empty topic', () => {
      expect(() => sanitizeTopic('')).toThrow();
    });

    it('should throw on topic too long', () => {
      const longTopic = 'a'.repeat(201);
      expect(() => sanitizeTopic(longTopic)).toThrow();
    });

    it('should trim whitespace', () => {
      expect(sanitizeTopic('  AI for retail  ')).toBe('AI for retail');
    });
  });

  describe('sanitizeStyle', () => {
    it('should sanitize valid style', () => {
      expect(sanitizeStyle('innovative')).toBe('innovative');
    });

    it('should return undefined for empty input', () => {
      expect(sanitizeStyle('')).toBeUndefined();
      expect(sanitizeStyle(undefined)).toBeUndefined();
    });

    it('should throw on style too long', () => {
      const longStyle = 'a'.repeat(101);
      expect(() => sanitizeStyle(longStyle)).toThrow();
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeStyle('innovative<script>')).toBe('innovativescript');
    });
  });

  describe('UUID Validation', () => {
    it('should validate correct UUID', () => {
      const validUUID = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidUUID(validUUID)).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });

    it('should validate session ID format', () => {
      const validSessionId = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidSessionId(validSessionId)).toBe(true);
    });

    it('should validate idea ID format', () => {
      const validIdeaId = '550e8400-e29b-41d4-a716-446655440000';
      expect(isValidIdeaId(validIdeaId)).toBe(true);
    });
  });
});
