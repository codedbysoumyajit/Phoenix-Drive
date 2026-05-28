// utils/helpers.js
import crypto from "crypto";
import path from "path";
import getDB from "./mongodb.js";
import log from "./console.js";
import storage from "./storage.js";

/**
 * Generates a random hexadecimal string for session secret.
 * @returns {Promise<string>} A promise that resolves with the random secret.
 */
export function generateRandomSecret() {
  return new Promise((resolve, reject) => {
    crypto.randomBytes(32, (err, buffer) => {
      if (err) {
        reject(err);
      } else {
        resolve(buffer.toString("hex"));
      }
    });
  });
}

/**
 * Encrypts a file buffer in-memory and stores the key/iv in the database.
 * @param {Buffer} fileData - The unencrypted file buffer.
 * @param {string} fileName - The unique name of the file to identify it in the DB.
 * @returns {Promise<Buffer>} The encrypted file buffer.
 */
export async function encryptFile(fileData, fileName) {
  const key = crypto.randomBytes(32); // Generate a random 32-byte key
  const iv = crypto.randomBytes(16); // Generate a random 16-byte IV

  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encryptedData = Buffer.concat([
    cipher.update(fileData),
    cipher.final(),
  ]);

  const db = await getDB();
  const dataCollection = db.collection("encryption_Data");

  // Save using unique fileName instead of local path to support remote backends
  await dataCollection.insertOne({
    filename: fileName,
    key: key.toString("hex"),
    iv: iv.toString("hex"),
  });

  log(`Encrypted file in-memory: ${fileName}`, "info");
  return encryptedData;
}

/**
 * Decrypts an encrypted file buffer in-memory using metadata from the database.
 * @param {string} fileName - The unique file name to query keys.
 * @param {Buffer} encryptedData - The encrypted file buffer.
 * @returns {Promise<Buffer>} The decrypted file buffer.
 */
export async function decryptFile(fileName, encryptedData) {
  const db = await getDB();
  const dataCollection = db.collection("encryption_Data");

  const fileData = await dataCollection.findOne({ filename: fileName });

  if (!fileData || !fileData.key || !fileData.iv) {
    throw new Error("Key or IV not found in database for decryption.");
  }

  const key = Buffer.from(fileData.key, "hex");
  const iv = Buffer.from(fileData.iv, "hex");

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decryptedData = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  log(`Decrypted file in-memory: ${fileName}`, "info");
  return decryptedData;
}

/**
 * Deletes a file from the filesystem.
 * @deprecated Kept for legacy compatibility if called, but storage.deleteFile should be preferred.
 * @param {string} filePath - The path of the file to delete.
 */
export function deleteFile(filePath) {
  // Legacy stub - forwards to storage if filename can be extracted, otherwise defaults to local delete
  try {
    const fileName = path.basename(filePath);
    storage.deleteFile(fileName);
  } catch (err) {
    log(`Delete file legacy error: ${err.message}`, "error");
  }
}

/**
 * Normalizes a filename by removing spaces.
 * @param {string} filename - The original filename.
 * @returns {string} The normalized filename.
 */
export function normalizeFileName(filename) {
  const fileN = filename.split(".")[0];
  return fileN.includes(" ") ? fileN.replace(/ /g, "") : fileN;
}

/**
 * Generates a short random ID.
 * @returns {string} A random alphanumeric string.
 */
export function generateShortID() {
  const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from(
    { length: crypto.randomInt(5, 11) },
    () => characters[crypto.randomInt(characters.length)],
  ).join("");
}

/**
 * Securely deletes a file from the storage provider and purges all of its metadata from MongoDB.
 * @param {string} fileName - The unique name of the file to delete.
 */
export async function purgeFile(fileName) {
  try {
    // 1. Delete file using Storage Manager (FTP, SFTP, or Local)
    await storage.deleteFile(fileName);

    const db = await getDB();
    
    // 2. Delete from encryption_Data collection
    const encResult = await db.collection("encryption_Data").deleteOne({ filename: fileName });
    if (encResult.deletedCount > 0) {
      log(`Cleared encryption keys from DB for: ${fileName}`, "info");
    }

    // 3. Delete from file_uploadData collection
    const uploadResult = await db.collection("file_uploadData").deleteOne({ filename: fileName });
    if (uploadResult.deletedCount > 0) {
      log(`Cleared upload metadata from DB for: ${fileName}`, "info");
    }

    return true;
  } catch (err) {
    log(`Error in purgeFile for ${fileName}: ${err.message}`, "error");
    throw err;
  }
}