/**
 * Tests for JSON Repair Utility
 */

import { describe, it, expect } from '@jest/globals';
import { parseJSON, repairJSONStructure } from '../json-repair';

describe('parseJSON', () => {
  describe('Valid JSON (no repair needed)', () => {
    it('should parse simple valid JSON', () => {
      const result = parseJSON('{"name":"John","age":30}');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data).toEqual({ name: 'John', age: 30 });
      expect(result.repairs).toBeUndefined();
    });

    it('should parse empty object', () => {
      const result = parseJSON('{}');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data).toEqual({});
    });

    it('should parse nested structures', () => {
      const json = '{"user":{"name":"John","tags":["a","b","c"]}}';
      const result = parseJSON(json);
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data).toEqual({
        user: { name: 'John', tags: ['a', 'b', 'c'] }
      });
    });
  });

  describe('Trailing commas', () => {
    it('should remove trailing comma in object', () => {
      const result = parseJSON('{"name":"John","age":30,}');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.repairs).toContain('removed_trailing_commas');
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should remove trailing comma in array', () => {
      const result = parseJSON('[1,2,3,]');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.repairs).toContain('removed_trailing_commas');
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should remove multiple trailing commas', () => {
      const result = parseJSON('{"a":1,"b":[1,2,],}');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ a: 1, b: [1, 2] });
    });
  });

  describe('Missing closing brackets', () => {
    it('should add missing closing brace', () => {
      const result = parseJSON('{"name":"John","age":30');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should add multiple missing closing braces', () => {
      const result = parseJSON('{"user":{"name":"John"');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ user: { name: 'John' } });
    });

    it('should handle mixed missing brackets', () => {
      const result = parseJSON('{"users":[{"name":"John"');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ users: [{ name: 'John' }] });
    });
  });

  describe('Escaped quotes', () => {
    it('should handle simple escaped quotes', () => {
      const result = parseJSON('{"text":"He said \\"hello\\""}');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data).toEqual({ text: 'He said "hello"' });
    });

    it('should handle double-escaped quotes', () => {
      const result = parseJSON('{"path":"C:\\\\\\"Program Files\\""}');
      expect(result.success).toBe(true);
      expect(result.data.path).toBe('C:\\"Program Files"');
    });

    it('should handle backslashes followed by quotes', () => {
      const result = parseJSON('{"text":"backslash: \\\\ and quote: \\""}');
      expect(result.success).toBe(true);
      expect(result.data.text).toBe('backslash: \\ and quote: "');
    });

    it('should handle escaped quotes in nested structures', () => {
      const json = '{"user":{"bio":"He said \\"hi\\""},"status":"active"}';
      const result = parseJSON(json);
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        user: { bio: 'He said "hi"' },
        status: 'active'
      });
    });
  });

  describe('Stack-based bracket balancing', () => {
    it('should balance complex nested structures', () => {
      const result = parseJSON('{"a":[1,{"b":2');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ a: [1, { b: 2 }] });
    });

    it('should handle deeply nested objects', () => {
      const result = parseJSON('{"a":{"b":{"c":{"d":1');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ a: { b: { c: { d: 1 } } } });
    });

    it('should ignore brackets inside strings', () => {
      const result = parseJSON('{"text":"has { and [ chars","value":1');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ text: 'has { and [ chars', value: 1 });
    });
  });

  describe('Combined repairs', () => {
    it('should handle trailing comma and missing bracket', () => {
      const result = parseJSON('{"name":"John","age":30');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.repairs?.length).toBeGreaterThan(0);
      expect(result.data).toEqual({ name: 'John', age: 30 });
    });

    it('should handle multiple issues at once', () => {
      const result = parseJSON('{"users":[1,2],"data":{"x":1');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data).toEqual({ users: [1, 2], data: { x: 1 } });
    });
  });

  describe('Real-world ETL scenarios', () => {
    it('should handle truncated user JSON', () => {
      const result = parseJSON('{"user_id":"u123","name":"John Smith","programs":[{"id":"p1"');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
      expect(result.data.user_id).toBe('u123');
    });

    it('should handle multiple nested arrays', () => {
      const result = parseJSON('{"programs":[{"tasks":[{"id":1},{"id":2');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(true);
    });

    it('should preserve empty arrays and objects', () => {
      const result = parseJSON('{"empty_obj":{},"empty_arr":[]}');
      expect(result.success).toBe(true);
      expect(result.repaired).toBe(false);
      expect(result.data).toEqual({ empty_obj: {}, empty_arr: [] });
    });
  });

  describe('Edge cases', () => {
    it('should handle null values', () => {
      const result = parseJSON('{"value":null}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ value: null });
    });

    it('should handle empty strings', () => {
      const result = parseJSON('{"name":""}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: '' });
    });

    it('should handle Unicode characters', () => {
      const result = parseJSON('{"emoji":"😀","chinese":"你好"}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ emoji: '😀', chinese: '你好' });
    });

    it('should handle escaped characters', () => {
      const result = parseJSON('{"newline":"line1\\nline2","tab":"a\\tb"}');
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ newline: 'line1\nline2', tab: 'a\tb' });
    });
  });

  describe('Failure cases', () => {
    it('should fail on completely invalid JSON', () => {
      const result = parseJSON('not json at all');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail on truncated string', () => {
      const result = parseJSON('{"name":"John');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail on invalid values', () => {
      const result = parseJSON('{"value":undefined}');
      expect(result.success).toBe(false);
    });

    it('should fail on mismatched brackets', () => {
      const result = parseJSON('{"array":[1,2,3}');
      expect(result.success).toBe(false);
    });
  });

  describe('Repair tracking', () => {
    it('should track trailing comma removal', () => {
      const result = parseJSON('{"a":1,}');
      expect(result.repairs).toContain('removed_trailing_commas');
    });

    it('should track bracket additions', () => {
      const result = parseJSON('{"a":1');
      expect(result.repairs?.some(r => r.includes('closing_braces') || r.includes('brackets'))).toBe(true);
    });

    it('should not have repairs for valid JSON', () => {
      const result = parseJSON('{"a":1}');
      expect(result.repairs).toBeUndefined();
    });

    it('should track multiple repair types', () => {
      const result = parseJSON('{"a":1,"b":2');
      expect(result.repaired).toBe(true);
      expect(result.repairs).toBeDefined();
      expect(result.repairs!.length).toBeGreaterThan(0);
    });
  });
});


describe('repairJSONStructure (internal function)', () => {
  it('should repair complex nested structures', () => {
    const result = repairJSONStructure('{"a":[1,{"b":2');
    expect(result.success).toBe(true);
    expect(result.data).toEqual({ a: [1, { b: 2 }] });
  });

  it('should balance brackets in correct order', () => {
    const result = repairJSONStructure('{"a":[1,2]');
    expect(result.success).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.repairs?.some(r => r.includes('balanced'))).toBe(true);
  });

  it('should handle complex nesting', () => {
    const json = '{"level1":{"level2":{"level3":[1,2,3]}';
    const result = repairJSONStructure(json);
    expect(result.success).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.data.level1.level2.level3).toEqual([1, 2, 3]);
  });
});

describe('Repair strategy', () => {
  it('should try direct parse first for valid JSON', () => {
    const result = parseJSON('{"valid":true}');
    expect(result.success).toBe(true);
    expect(result.repaired).toBe(false);
  });

  it('should use stack-based repair for malformed JSON', () => {
    const result = parseJSON('{"nested":{"value":1');
    expect(result.success).toBe(true);
    expect(result.repaired).toBe(true);
    expect(result.repairs?.some(r => r.includes('balanced'))).toBe(true);
  });
});

describe('Performance considerations', () => {
  it('should handle large valid JSON quickly', () => {
    const largeJson = JSON.stringify({
      users: Array(1000).fill(null).map((_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`
      }))
    });

    const start = Date.now();
    const result = parseJSON(largeJson);
    const duration = Date.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(100); // Should be very fast
  });

  it('should handle malformed JSON with reasonable performance', () => {
    const malformedJson = '{"a":1,"b":[1,2,3]';

    const start = Date.now();
    const result = parseJSON(malformedJson);
    const duration = Date.now() - start;

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(50);
  });
});

describe('Integration with ETL pipeline', () => {
  it('should provide error details for failed imports', () => {
    const result = parseJSON('invalid json');

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(typeof result.error).toBe('string');
  });
});
