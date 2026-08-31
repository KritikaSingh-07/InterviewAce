import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Get the encryption key from environment.
 * Must be a 32-byte hex string (64 hex characters).
 */
const DEFAULT_KEY_HEX = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

const getEncryptionKey = () => {
  const key = process.env.ENCRYPTION_KEY || DEFAULT_KEY_HEX;
  return Buffer.from(key, 'hex');
};

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {{ iv: string, encryptedData: string, authTag: string }}
 */
export const encrypt = (plaintext) => {
  if (!plaintext) return null;
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted,
    authTag,
  };
};

/**
 * Decrypt an encrypted object back to plaintext.
 * @param {{ iv: string, encryptedData: string, authTag: string }} encObj
 * @returns {string}
 */
export const decrypt = (encObj) => {
  if (!encObj || !encObj.iv || !encObj.encryptedData || !encObj.authTag) {
    return null;
  }
  const key = getEncryptionKey();
  const iv = Buffer.from(encObj.iv, 'hex');
  const authTag = Buffer.from(encObj.authTag, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encObj.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

/**
 * Mask an account number, showing only last 4 digits.
 * @param {string} accountNumber
 * @returns {string} e.g., "XXXX1234"
 */
export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || accountNumber.length < 4) return 'XXXX';
  return 'XXXX' + accountNumber.slice(-4);
};

/**
 * Mask a UPI ID, showing only the handle portion.
 * @param {string} upiId e.g., "name@upi"
 * @returns {string} e.g., "n***@upi"
 */
export const maskUpiId = (upiId) => {
  if (!upiId || !upiId.includes('@')) return '****';
  const [name, handle] = upiId.split('@');
  if (name.length <= 1) return `${name}***@${handle}`;
  return `${name[0]}***@${handle}`;
};
