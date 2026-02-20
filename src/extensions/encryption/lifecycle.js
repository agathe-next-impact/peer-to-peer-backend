'use strict';

/**
 * ============================================================================
 * ENCRYPTION MIDDLEWARE — AES-256-GCM
 * ============================================================================
 *
 * Ce middleware intercepte les opérations CRUD sur les content-types de la
 * zone privée pour chiffrer/déchiffrer les champs sensibles.
 *
 * TYPES DE CHAMPS SUPPORTÉS :
 *   - string / text / richtext → chiffrement direct (stocké en varchar/text)
 *   - json → chiffrement avec wrapper JSON { __encrypted: "v1:..." }
 *
 * TYPES NON SUPPORTÉS (ignorés automatiquement) :
 *   - enumeration, integer, decimal, float, boolean, date, datetime
 *   - component, relation, media
 *
 * PRÉREQUIS :
 *   - Variable d'environnement ENCRYPTION_KEY (clé 256 bits en hex)
 */

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 128 bits
const AUTH_TAG_LENGTH = 16;  // 128 bits
const KEY_VERSION = 'v1';    // Pour la rotation des clés

// Types de champs qui supportent le chiffrement
const ENCRYPTABLE_TYPES = new Set(['string', 'text', 'richtext', 'json']);

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement.
 */
function getEncryptionKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex) {
    throw new Error(
      '[Encryption] ENCRYPTION_KEY non définie. ' +
      'Générez-en une avec: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(keyHex, 'hex');
}

// ---------------------------------------------------------------------------
// Chiffrement / Déchiffrement
// ---------------------------------------------------------------------------

function encrypt(plaintext) {
  if (plaintext === null || plaintext === undefined) return plaintext;

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const stringValue = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
  let encrypted = cipher.update(stringValue, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const authTag = cipher.getAuthTag();

  // Format : version:iv:authTag:ciphertext (tout en base64)
  return [
    KEY_VERSION,
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':');
}

function decrypt(encryptedValue) {
  if (encryptedValue === null || encryptedValue === undefined) return encryptedValue;
  if (typeof encryptedValue !== 'string' || !encryptedValue.includes(':')) return encryptedValue;

  try {
    const parts = encryptedValue.split(':');
    if (parts.length !== 4) return encryptedValue;

    const [version, ivB64, authTagB64, ciphertext] = parts;

    const key = getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    // Tenter de parser en JSON si applicable
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('[Encryption] Erreur de déchiffrement:', err.message);
    return encryptedValue;
  }
}

// ---------------------------------------------------------------------------
// Schema-aware encryption helpers
// ---------------------------------------------------------------------------

/**
 * Analyse le schema d'un content-type pour déterminer quels champs sont
 * réellement encryptables et lesquels sont de type JSON.
 */
function getEncryptionInfo(uid, strapi) {
  const contentType = strapi.contentTypes[uid];
  if (!contentType) return { fields: [], jsonFields: new Set() };

  const encryptionConfig = contentType.pluginOptions?.encryption;
  if (!encryptionConfig?.enabled) return { fields: [], jsonFields: new Set() };

  const declaredFields = encryptionConfig.fields || [];
  const schema = contentType.attributes || {};

  // Filtrer les champs non-encryptables
  const fields = declaredFields.filter((f) => {
    const fieldType = schema[f]?.type;
    if (!fieldType || !ENCRYPTABLE_TYPES.has(fieldType)) {
      // Log une seule fois au démarrage (pas ici, voir registerEncryptionLifecycles)
      return false;
    }
    return true;
  });

  const jsonFields = new Set(fields.filter((f) => schema[f]?.type === 'json'));

  return { fields, jsonFields };
}

/**
 * Chiffre les champs spécifiés dans les données.
 * Les champs JSON sont wrappés dans { __encrypted: "v1:..." } pour rester
 * du JSON valide en base PostgreSQL (colonne jsonb).
 */
function encryptFields(data, fields, jsonFields) {
  if (!data) return data;
  const encrypted = { ...data };
  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      const encValue = encrypt(encrypted[field]);
      if (jsonFields && jsonFields.has(field)) {
        // Wrapper en objet JSON valide pour les colonnes jsonb
        encrypted[field] = { __encrypted: encValue };
      } else {
        encrypted[field] = encValue;
      }
    }
  }
  return encrypted;
}

/**
 * Déchiffre les champs spécifiés dans les données.
 * Gère les deux formats : string direct et wrapper JSON { __encrypted }.
 */
function decryptFields(data, fields) {
  if (!data) return data;
  const decrypted = { ...data };
  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      const value = decrypted[field];
      if (typeof value === 'object' && value !== null && value.__encrypted) {
        // Wrapper JSON → déchiffrer la valeur interne
        decrypted[field] = decrypt(value.__encrypted);
      } else if (typeof value === 'string') {
        // Chiffrement direct (string/text)
        decrypted[field] = decrypt(value);
      }
    }
  }
  return decrypted;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Enregistre les lifecycle hooks de chiffrement pour tous les content-types
 * de la zone privée.
 */
function registerEncryptionLifecycles(strapi) {
  const privateContentTypes = [
    'api::personal-notebook.personal-notebook',
    'api::personal-goal.personal-goal',
    'api::self-assessment.self-assessment',
    'api::generated-document.generated-document',
    'api::personal-calendar-event.personal-calendar-event',
    'api::recovery-profile.recovery-profile',
    'api::recovery-recommendation.recovery-recommendation',
    'api::situation-observation.situation-observation',
    'api::situation-thesaurus.situation-thesaurus',
    'api::situation-objective.situation-objective',
    'api::self-problem-solving.self-problem-solving',
    'api::early-warning-sign.early-warning-sign',
  ];

  for (const uid of privateContentTypes) {
    const { fields, jsonFields } = getEncryptionInfo(uid, strapi);
    if (fields.length === 0) continue;

    // Avertir sur les champs ignorés
    const declaredFields = strapi.contentTypes[uid]?.pluginOptions?.encryption?.fields || [];
    const skipped = declaredFields.filter((f) => !fields.includes(f));
    if (skipped.length > 0) {
      strapi.log.warn(
        `[Encryption] ${uid} — champs ignorés (type non supporté): ${skipped.join(', ')}`
      );
    }

    const jsonFieldNames = jsonFields.size > 0 ? ` (json: ${[...jsonFields].join(', ')})` : '';
    strapi.log.info(
      `[Encryption] Chiffrement activé pour ${uid} — champs: ${fields.join(', ')}${jsonFieldNames}`
    );

    strapi.db.lifecycles.subscribe({
      models: [uid],

      async beforeCreate(event) {
        event.params.data = encryptFields(event.params.data, fields, jsonFields);
      },

      async beforeUpdate(event) {
        if (event.params.data) {
          event.params.data = encryptFields(event.params.data, fields, jsonFields);
        }
      },

      // NOTE : afterFind / afterFindOne ne sont PAS utilisés ici.
      // En Strapi v5, les modifications de event.result dans les DB lifecycle
      // hooks ne sont pas propagées jusqu'à la réponse REST API.
      // Le déchiffrement est effectué dans le controller privé (private-controller.js).
    });
  }
}

module.exports = {
  encrypt,
  decrypt,
  decryptFields,
  getEncryptionInfo,
  registerEncryptionLifecycles,
};
