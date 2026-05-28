// utils/storage.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable, Writable } from 'stream';
import Client from 'basic-ftp';
import SftpClient from 'ssh2-sftp-client';
import config from '../../config/config.js';
import log from './console.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename)); // Go up two levels to reach 'src'

// Custom Writable stream to aggregate chunks into a Buffer in-memory
class MemoryWritable extends Writable {
  constructor() {
    super();
    this.chunks = [];
  }
  _write(chunk, encoding, callback) {
    this.chunks.push(chunk);
    callback();
  }
  toBuffer() {
    return Buffer.concat(this.chunks);
  }
}

class StorageManager {
  constructor() {
    this.provider = config.settings.storageProvider || 'local';
    log(`Initializing Storage Manager with provider: ${this.provider}`, 'info');
  }

  // Helper to get local file path
  getLocalPath(fileName) {
    return path.join(__dirname, 'uploads', fileName);
  }

  /**
   * Saves a file buffer to the configured storage provider.
   * @param {string} fileName 
   * @param {Buffer} buffer 
   */
  async putFile(fileName, buffer) {
    try {
      if (this.provider === 'local') {
        const filePath = this.getLocalPath(fileName);
        // Ensure directory exists
        if (!fs.existsSync(path.dirname(filePath))) {
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
        }
        fs.writeFileSync(filePath, buffer);
        log(`Saved file locally: ${fileName}`, 'info');
        return true;
      } 
      
      if (this.provider === 'ftp') {
        const ftpConfig = config.settings.ftp;
        const client = new Client.Client();
        client.ftp.ipFamily = 4; // Default to IPv4
        
        await client.access({
          host: ftpConfig.host,
          port: ftpConfig.port,
          user: ftpConfig.user,
          password: ftpConfig.password,
          secure: ftpConfig.secure,
        });

        // Ensure remote directory exists and cd into it
        await client.ensureDir(ftpConfig.remotePath);
        
        // Convert Buffer to Readable Stream
        const stream = Readable.from(buffer);
        await client.uploadFrom(stream, fileName);
        client.close();
        
        log(`Uploaded file to FTP server: ${fileName}`, 'info');
        return true;
      } 
      
      if (this.provider === 'sftp') {
        const sftpConfig = config.settings.sftp;
        const sftp = new SftpClient();
        
        await sftp.connect({
          host: sftpConfig.host,
          port: sftpConfig.port,
          username: sftpConfig.username,
          password: sftpConfig.password,
        });

        // Ensure remote directory exists
        const exists = await sftp.exists(sftpConfig.remotePath);
        if (!exists) {
          await sftp.mkdir(sftpConfig.remotePath, true);
        }

        const remoteFilePath = path.posix.join(sftpConfig.remotePath, fileName);
        await sftp.put(buffer, remoteFilePath);
        await sftp.end();
        
        log(`Uploaded file to SFTP server: ${fileName}`, 'info');
        return true;
      }

      throw new Error(`Unsupported storage provider: ${this.provider}`);
    } catch (err) {
      log(`Error putting file ${fileName} using ${this.provider}: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Retrieves a file from the configured storage provider and returns it as a Buffer.
   * @param {string} fileName 
   * @returns {Promise<Buffer>}
   */
  async getFile(fileName) {
    try {
      if (this.provider === 'local') {
        const filePath = this.getLocalPath(fileName);
        if (!fs.existsSync(filePath)) {
          throw new Error('File not found on local disk.');
        }
        log(`Retrieved file locally: ${fileName}`, 'info');
        return fs.readFileSync(filePath);
      } 
      
      if (this.provider === 'ftp') {
        const ftpConfig = config.settings.ftp;
        const client = new Client.Client();
        client.ftp.ipFamily = 4;
        
        await client.access({
          host: ftpConfig.host,
          port: ftpConfig.port,
          user: ftpConfig.user,
          password: ftpConfig.password,
          secure: ftpConfig.secure,
        });

        await client.cd(ftpConfig.remotePath);
        
        const memoryStream = new MemoryWritable();
        await client.downloadToStream(memoryStream, fileName);
        client.close();

        log(`Retrieved file from FTP server: ${fileName}`, 'info');
        return memoryStream.toBuffer();
      } 
      
      if (this.provider === 'sftp') {
        const sftpConfig = config.settings.sftp;
        const sftp = new SftpClient();
        
        await sftp.connect({
          host: sftpConfig.host,
          port: sftpConfig.port,
          username: sftpConfig.username,
          password: sftpConfig.password,
        });

        const remoteFilePath = path.posix.join(sftpConfig.remotePath, fileName);
        const fileBuffer = await sftp.get(remoteFilePath);
        await sftp.end();

        log(`Retrieved file from SFTP server: ${fileName}`, 'info');
        return fileBuffer;
      }

      throw new Error(`Unsupported storage provider: ${this.provider}`);
    } catch (err) {
      log(`Error getting file ${fileName} using ${this.provider}: ${err.message}`, 'error');
      throw err;
    }
  }

  /**
   * Deletes a file from the configured storage provider.
   * @param {string} fileName 
   */
  async deleteFile(fileName) {
    try {
      if (this.provider === 'local') {
        const filePath = this.getLocalPath(fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          log(`Deleted file locally: ${fileName}`, 'info');
        }
        return true;
      } 
      
      if (this.provider === 'ftp') {
        const ftpConfig = config.settings.ftp;
        const client = new Client.Client();
        client.ftp.ipFamily = 4;
        
        await client.access({
          host: ftpConfig.host,
          port: ftpConfig.port,
          user: ftpConfig.user,
          password: ftpConfig.password,
          secure: ftpConfig.secure,
        });

        await client.cd(ftpConfig.remotePath);
        await client.remove(fileName);
        client.close();

        log(`Deleted file on FTP server: ${fileName}`, 'info');
        return true;
      } 
      
      if (this.provider === 'sftp') {
        const sftpConfig = config.settings.sftp;
        const sftp = new SftpClient();
        
        await sftp.connect({
          host: sftpConfig.host,
          port: sftpConfig.port,
          username: sftpConfig.username,
          password: sftpConfig.password,
        });

        const remoteFilePath = path.posix.join(sftpConfig.remotePath, fileName);
        await sftp.delete(remoteFilePath);
        await sftp.end();

        log(`Deleted file on SFTP server: ${fileName}`, 'info');
        return true;
      }

      throw new Error(`Unsupported storage provider: ${this.provider}`);
    } catch (err) {
      log(`Error deleting file ${fileName} using ${this.provider}: ${err.message}`, 'error');
      // Return true even if deletion fails so database state stays clean
      return true;
    }
  }
}

const storage = new StorageManager();
export default storage;
