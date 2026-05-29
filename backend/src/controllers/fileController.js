// controllers/fileController.js
import qrCode from "qrcode";
import { DateTime } from "luxon";
import log from "../utils/console.js";
import getDB from "../utils/mongodb.js";
import config from "../../config/config.js";
import storage from "../utils/storage.js";
import {
  encryptFile,
  decryptFile,
  normalizeFileName,
  generateShortID,
  purgeFile,
} from "../utils/helpers.js";

/**
 * Returns all files uploaded by the authenticated user as JSON.
 */
export const getUserFiles = async (req, res) => {
  try {
    const username = req.session.user;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    // Fetch all files uploaded by this user, sorted newest first
    const userFiles = await dataCollection.find({ uploader: username }).sort({ _id: -1 }).toArray();

    return res.status(200).json({
      success: true,
      username,
      files: userFiles,
      encryptionEnabled: config.settings.encryption,
      domain: config.settings.domain,
    });
  } catch (err) {
    log(`Error fetching user files dashboard: ${err.message}`, "error");
    return res.status(500).json({ error: "Failed to load files." });
  }
};

/**
 * Handles uploading one or more files.
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const username = req.session.user;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    const rawFiles = req.files.file;
    const filesToProcess = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
    const uploadedFilesResults = [];

    for (const file of filesToProcess) {
      const fileExtension = pathExtension(file.name);
      const normalizedName = normalizeFileName(file.name);
      const shortID = generateShortID();
      const fileName = `${normalizedName}-${shortID}${fileExtension}`;

      // Links creation
      const downloadLink = `${config.settings.domain}/download/${fileName}`;
      const qrdownloadLink = `${config.settings.domain}/cdn/${fileName}`;
      const viewLink = `${config.settings.domain}/view/${fileName}`;
      const cdnLink = `${config.settings.domain}/cdn/${fileName}`;

      const localDateTime = DateTime.local();
      const formattedOutput = `Date: ${localDateTime.toLocaleString(
        DateTime.DATE_FULL,
      )} Time: ${localDateTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`;

      // Generate QR Code base64 data URL
      const qrCodeImage = await qrCode.toDataURL(qrdownloadLink);

      // Perform in-memory encryption if configured
      let finalBuffer = file.data;
      if (config.settings.encryption) {
        finalBuffer = await encryptFile(file.data, fileName);
      }

      // Save via pluggable Storage Manager
      await storage.putFile(fileName, finalBuffer);

      // Calculate sizes in-memory directly from the final stored buffer
      const fileSizeInBytes = finalBuffer.length;
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
      const displaySize = fileSizeInMegabytes < 1 ? `${(fileSizeInBytes / 1024).toFixed(1)} KB` : `${fileSizeInMegabytes.toFixed(1)} MB`;

      const fileDoc = {
        filename: fileName,
        originalName: file.name,
        uploadTime: formattedOutput,
        uploader: username,
        encryption: `${config.settings.encryption}`,
        fileSize: displaySize,
      };

      await dataCollection.insertOne(fileDoc);
      log(`File uploaded successfully to ${config.settings.storageProvider} backend: ${fileName} by ${username}`, "info");

      uploadedFilesResults.push({
        fileName,
        originalName: file.name,
        downloadLink,
        viewLink,
        cdnLink,
        qrCodeImage,
        uploader: username,
        uploadTime: formattedOutput,
        fileSize: displaySize,
        encryption: config.settings.encryption,
      });
    }

    // Return JSON data containing the upload details
    return res.status(200).json({ success: true, files: uploadedFilesResults });

  } catch (err) {
    log(`File upload controller error: ${err.message}`, "error");
    return res.status(500).json({ error: "File upload failed due to a server error." });
  }
};

/**
 * Handles file upload from web share API.
 */
export const webshareUploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.mediaFiles) {
      return res.status(400).render("error", { errorMessage: "No file was uploaded." });
    }

    const username = req.session.user;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    const rawFiles = req.files.mediaFiles;
    const filesToProcess = Array.isArray(rawFiles) ? rawFiles : [rawFiles];

    for (const file of filesToProcess) {
      const fileExtension = pathExtension(file.name);
      const normalizedName = normalizeFileName(file.name);
      const shortID = generateShortID();
      const fileName = `${normalizedName}-${shortID}${fileExtension}`;

      let finalBuffer = file.data;
      if (config.settings.encryption) {
        finalBuffer = await encryptFile(file.data, fileName);
      }

      await storage.putFile(fileName, finalBuffer);

      const fileSizeInBytes = finalBuffer.length;
      const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
      const displaySize = fileSizeInMegabytes < 1 ? `${(fileSizeInBytes / 1024).toFixed(1)} KB` : `${fileSizeInMegabytes.toFixed(1)} MB`;

      const localDateTime = DateTime.local();
      const formattedOutput = `Date: ${localDateTime.toLocaleString(
        DateTime.DATE_FULL,
      )} Time: ${localDateTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`;

      await dataCollection.insertOne({
        filename: fileName,
        originalName: file.name,
        uploadTime: formattedOutput,
        uploader: username,
        encryption: `${config.settings.encryption}`,
        fileSize: displaySize,
      });
    }

    res.redirect("/upload");
  } catch (err) {
    log(`Webshare controller error: ${err.message}`, "error");
    res.status(500).render("error", { errorMessage: "Webshare upload failed." });
  }
};

/**
 * Handles secure file deletion.
 */
export const deleteFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    const username = req.session.user;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    // Find file and verify ownership
    const file = await dataCollection.findOne({ filename: fileName });
    if (!file) {
      return res.status(404).json({ error: "File not found in database." });
    }

    if (file.uploader !== username) {
      return res.status(403).json({ error: "Unauthorized. You do not own this file." });
    }

    // Purge file from storage provider and database collections
    await purgeFile(fileName);

    return res.status(200).json({ success: true, message: "File purged successfully." });
  } catch (err) {
    log(`Delete controller error: ${err.message}`, "error");
    return res.status(500).json({ error: "Failed to delete file." });
  }
};

/**
 * Retrieves file metadata as JSON.
 */
export const getFileMetadata = async (req, res) => {
  try {
    const { fileName } = req.params;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    // Rely on MongoDB metadata existence instead of local disk check to support remote storage
    const fileData = await dataCollection.findOne({ filename: fileName });

    if (!fileData) {
      log(`File metadata not found for ${fileName} in DB.`, "warn");
      return res.status(404).json({ error: "File not found or metadata missing." });
    }

    return res.status(200).json({
      success: true,
      fileName,
      originalName: fileData.originalName || fileName,
      uploadTime: fileData.uploadTime,
      uploader: fileData.uploader,
      fileSize: fileData.fileSize,
      encryption: fileData.encryption,
      apiLink: `${config.settings.domain}/cdn/${fileName}`,
      viewLink: `${config.settings.domain}/view/${fileName}`
    });
  } catch (err) {
    log(`Metadata retrieval error: ${err.message}`, "error");
    return res.status(500).json({ error: "An error occurred while fetching file metadata." });
  }
};

/**
 * Handles direct file download/CDN access.
 */
export const cdnFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    const fileData = await dataCollection.findOne({ filename: fileName });

    if (!fileData) {
      log(`File metadata not found for ${fileName} in DB.`, "warn");
      return res.status(404).render("error", { errorMessage: "File metadata missing." });
    }

    // 1. Download file buffer from active storage backend
    let fileBuffer;
    try {
      fileBuffer = await storage.getFile(fileName);
    } catch (storageErr) {
      log(`Storage retrieval error for ${fileName}: ${storageErr.message}`, "error");
      return res.status(404).render("error", { errorMessage: "File could not be retrieved from storage backend." });
    }

    // 2. Decrypt in-memory if needed
    let outputBuffer = fileBuffer;
    if (fileData.encryption === "true") {
      try {
        outputBuffer = await decryptFile(fileName, fileBuffer);
      } catch (decryptErr) {
        log(`Decryption error for ${fileName}: ${decryptErr.message}`, "error");
        return res.status(500).render("error", { errorMessage: "Error decrypting file." });
      }
    }

    // 3. Send file directly as a download stream
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalName || fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(outputBuffer);

  } catch (err) {
    log(`CDN direct downloader error: ${err.message}`, "error");
    if (!res.headersSent) {
      return res.status(500).render("error", { errorMessage: "Error occurred while fetching download." });
    }
  }
};

// Removed renderViewPage since Next.js viewer page uses the unified getFileMetadata API

// Tiny helper to parse file extensions safely
function pathExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}
