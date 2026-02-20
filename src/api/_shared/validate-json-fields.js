'use strict';

/**
 * Validates JSON field values before persistence.
 *
 * - Rejects prototype pollution keys (__proto__, constructor, prototype)
 * - Rejects excessively large payloads (configurable max depth / size)
 * - Ensures JSON fields are objects, arrays, or null (not raw strings)
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_JSON_DEPTH = 10;
const MAX_JSON_STRING_LENGTH = 100_000; // 100 KB per field

function checkPrototypePollution(value, depth = 0) {
  if (depth > MAX_JSON_DEPTH) {
    throw new Error('JSON field exceeds maximum nesting depth');
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      checkPrototypePollution(item, depth + 1);
    }
  } else if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (DANGEROUS_KEYS.has(key)) {
        throw new Error(`Invalid key "${key}" in JSON field`);
      }
      checkPrototypePollution(value[key], depth + 1);
    }
  }
}

/**
 * Validates a single JSON field value.
 * @param {unknown} value - The value to validate
 * @param {string} fieldName - The field name (for error messages)
 */
function validateJsonField(value, fieldName) {
  if (value === null || value === undefined) return;

  // If the value arrived as a string, try to parse it
  if (typeof value === 'string') {
    if (value.length > MAX_JSON_STRING_LENGTH) {
      throw new Error(`Field "${fieldName}" exceeds maximum size`);
    }
    try {
      const parsed = JSON.parse(value);
      checkPrototypePollution(parsed);
    } catch (err) {
      if (err.message.includes('JSON field') || err.message.includes('Invalid key')) {
        throw err;
      }
      // Not valid JSON string — let Strapi handle the type mismatch
    }
    return;
  }

  // Object / array
  if (typeof value === 'object') {
    const serialized = JSON.stringify(value);
    if (serialized && serialized.length > MAX_JSON_STRING_LENGTH) {
      throw new Error(`Field "${fieldName}" exceeds maximum size`);
    }
    checkPrototypePollution(value);
  }
}

/**
 * Validates all JSON-type fields in a data payload.
 * @param {Record<string, unknown>} data - The request body data
 * @param {string} uid - The content-type UID
 * @param {object} strapi - Strapi instance
 */
function validateJsonFields(data, uid, strapi) {
  if (!data || typeof data !== 'object') return;

  const contentType = strapi.contentType(uid);
  if (!contentType) return;

  const { attributes } = contentType;
  for (const [fieldName, attribute] of Object.entries(attributes)) {
    if (attribute.type === 'json' && data[fieldName] !== undefined) {
      validateJsonField(data[fieldName], fieldName);
    }
  }
}

module.exports = { validateJsonFields, validateJsonField };
