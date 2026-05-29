import { MongoClient } from 'mongodb';
import log from './console.js';
import config from './../../config/config.js';

/**
 * A promise that resolves to the connected MongoDB client.
 * This pattern prevents race conditions by caching the connection promise.
 * @type {Promise<MongoClient> | null}
 */
let clientPromise = null;

/**
 * Establishes a connection to the MongoDB server.
 * @returns {Promise<MongoClient>} A promise that resolves to the connected client.
 */
function connectToMongo() {
  if (!clientPromise) {
    const client = new MongoClient(config.settings.mongoURI);
    log('Attempting to connect to MongoDB server...');

    // Begin the connection process and cache the promise
    clientPromise = client.connect()
      .then(async connectedClient => {
        log('Successfully connected to MongoDB server.');
        try {
          const db = connectedClient.db('phoenix-xshare');
          await db.collection('users').createIndex({ username: 1 }, { unique: true });
          log('Unique index on users.username ensured.');

          // Index file_uploadData for supercharged searches and dashboard retrieval
          const fileUploadColl = db.collection('file_uploadData');
          await fileUploadColl.createIndex({ filename: 1 }, { unique: true });
          await fileUploadColl.createIndex({ uploader: 1, parentFolder: 1 });
          log('Indexes on file_uploadData ensured.');

          // Index encryption_Data for instant lookup of encryption credentials
          const encryptionColl = db.collection('encryption_Data');
          await encryptionColl.createIndex({ filename: 1 }, { unique: true });
          log('Indexes on encryption_Data ensured.');
        } catch (indexErr) {
          log(`Failed to create database indexes: ${indexErr.message}`, 'warn');
        }
        return connectedClient;
      })
      .catch(error => {
        log(`Failed to connect to MongoDB: ${error.message}`, 'error');
        // Reset the promise on failure to allow for future connection attempts
        clientPromise = null;
        // Re-throw the error to ensure calling functions are aware of the failure
        throw error;
      });
  }
  return clientPromise;
}

/**
 * Gets the singleton instance of the 'phoenix-xshare' database.
 * This function will establish a connection on the first call and reuse it for all subsequent calls.
 *
 * @returns {Promise<import('mongodb').Db>} A promise that resolves to the database instance.
 */
async function getDB() {
  const client = await connectToMongo();
  return client.db('phoenix-xshare');
}

export default getDB;
