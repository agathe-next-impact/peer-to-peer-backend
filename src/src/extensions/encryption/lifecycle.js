'use strict';

/**
 * ============================================================================
 * ENCRYPTION MIDDLEWARE — AES-256-GCM
 * ============================================================================
 *
 * Ce middleware intercepte les opérations CRUD sur les content-types de la
 * zone privée pour chiffrer/déchiffrer les champs sensibles.
 *
 * PRÉREQUIS :
 *   - Variable d'environnement ENCRYPTION_KEY (clé 256 bits en hex ou base64)
 *   - Optionnel : intégration avec un KMS (AWS KMS, HashiCorp Vault, etc.)
 *
 * INSTALLATION :
 *   Importer dans src/index.js :
 *   ```
 *   const { registerEncryptionLifecycles } = require('./extensions/encryption/lifecycle');
 *   module.exports = {
 *     bootstrap({ strapi }) {
 *       registerEncryptionLifecycles(strapi);
 *     },
 *   };
 *   ```
 */

const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;        // 128 bits
const AUTH_TAG_LENGTH = 16;  // 128 bits
const KEY_VERSION = 'v1';    // Pour la rotation des clés

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement.
 * En production, utiliser un KMS (AWS KMS, HashiCorp Vault, etc.)
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
    // TODO : gérer la rotation des clés basée sur 'version'

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
    strapi.log.error('[Encryption] Erreur de déchiffrement:', err.message);
    return encryptedValue;
  }
}

// ---------------------------------------------------------------------------
// Lifecycle Hooks
// ---------------------------------------------------------------------------

/**
 * Récupère la liste des champs chiffrés depuis le schema du content-type.
 */
function getEncryptedFields(uid) {
  const contentType = strapi.contentTypes[uid];
  if (!contentType) return [];

  const encryptionConfig = contentType.pluginOptions?.encryption;
  if (!encryptionConfig?.enabled) return [];

  return encryptionConfig.fields || [];
}

/**
 * Chiffre les champs spécifiés dans les données.
 */
function encryptFields(data, fields) {
  if (!data) return data;
  const encrypted = { ...data };
  for (const field of fields) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  }
  return encrypted;
}

/**
 * Déchiffre les champs spécifiés dans les données.
 */
function decryptFields(data, fields) {
  if (!data) return data;
  const decrypted = { ...data };
  for (const field of fields) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      decrypted[field] = decrypt(decrypted[field]);
    }
  }
  return decrypted;
}

/**
 * Déchiffre récursivement (pour les résultats paginés ou les arrays).
 */
function decryptResult(result, fields) {
  if (!result) return result;

  if (Array.isArray(result)) {
    return result.map((item) => decryptFields(item, fields));
  }

  if (result.results && Array.isArray(result.results)) {
    result.results = result.results.map((item) => decryptFields(item, fields));
    return result;
  }

  return decryptFields(result, fields);
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
  ];

  for (const uid of privateContentTypes) {
    const fields = getEncryptedFields(uid);
    if (fields.length === 0) continue;

    strapi.log.info(`[Encryption] Chiffrement activé pour ${uid} — champs: ${fields.join(', ')}`);

    strapi.db.lifecycles.subscribe({
      models: [uid],

      async beforeCreate(event) {
        event.params.data = encryptFields(event.params.data, fields);
      },

      async beforeUpdate(event) {
        if (event.params.data) {
          event.params.data = encryptFields(event.params.data, fields);
        }
      },

      async afterFind(event) {
        event.result = decryptResult(event.result, fields);
      },

      async afterFindOne(event) {
        if (event.result) {
          event.result = decryptFields(event.result, fields);
        }
      },
    });
  }
}

module.exports = {
  encrypt,
  decrypt,
  registerEncryptionLifecycles,
};
