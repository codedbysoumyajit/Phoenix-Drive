// controllers/fileController.js
import qrCode from "qrcode";
import { DateTime } from "luxon";
import AdmZip from "adm-zip";
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

const STORAGE_BAR_CAP_BYTES = 1024 * 1024 * 1024;

const parseStoredFileSizeToBytes = (fileDoc) => {
  if (typeof fileDoc.fileSizeBytes === "number" && Number.isFinite(fileDoc.fileSizeBytes)) {
    return fileDoc.fileSizeBytes;
  }

  if (!fileDoc.fileSize || typeof fileDoc.fileSize !== "string") {
    return 0;
  }

  const match = fileDoc.fileSize.trim().match(/^([\d.]+)\s*(KB|MB|GB)$/i);
  if (!match) {
    return 0;
  }

  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) {
    return 0;
  }

  const unit = match[2].toUpperCase();
  if (unit === "KB") return value * 1024;
  if (unit === "MB") return value * 1024 * 1024;
  if (unit === "GB") return value * 1024 * 1024 * 1024;

  return 0;
};

const formatStorageFootprint = (bytes) => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 KB";
  }

  const megabytes = bytes / (1024 * 1024);
  if (megabytes < 1) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (megabytes < 1024) {
    return `${megabytes.toFixed(1)} MB`;
  }

  return `${(megabytes / 1024).toFixed(1)} GB`;
};

/**
 * Returns all files and folders uploaded by the authenticated user in the active folder as JSON.
 */
export const getUserFiles = async (req, res) => {
  try {
    const username = req.session.user;
    const parentFolder = req.query.folder || "root";
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    // Fetch folders and files that belong to this parentFolder and uploader, sorting folders first
    const userFiles = await dataCollection.find({ 
      uploader: username, 
      parentFolder: parentFolder 
    }).sort({ isFolder: -1, _id: -1 }).toArray();

    const userDriveFiles = await dataCollection.find({
      uploader: username,
      isFolder: false,
    }).toArray();

    const totalDriveStorageBytes = userDriveFiles.reduce(
      (total, fileDoc) => total + parseStoredFileSizeToBytes(fileDoc),
      0,
    );

    const totalDriveFilesCount = userDriveFiles.length;
    const storageUsagePercent = totalDriveStorageBytes > 0
      ? Math.min(100, (totalDriveStorageBytes / STORAGE_BAR_CAP_BYTES) * 100)
      : 0;

    // Helper to recursively fetch parent names for breadcrumbs
    const getBreadcrumbs = async (folderName, user, coll) => {
      const breadcrumbs = [];
      let current = folderName;
      while (current && current !== "root") {
        const folderDoc = await coll.findOne({ filename: current, uploader: user, isFolder: true });
        if (!folderDoc) break;
        breadcrumbs.unshift({
          filename: folderDoc.filename,
          originalName: folderDoc.originalName
        });
        current = folderDoc.parentFolder;
      }
      breadcrumbs.unshift({ filename: "root", originalName: "Root" });
      return breadcrumbs;
    };

    const breadcrumbs = await getBreadcrumbs(parentFolder, username, dataCollection);

    return res.status(200).json({
      success: true,
      username,
      files: userFiles,
      breadcrumbs,
      currentFolder: parentFolder,
      encryptionEnabled: config.settings.encryption,
      domain: config.settings.domain,
      storageSummary: {
        totalBytes: totalDriveStorageBytes,
        totalFilesCount: totalDriveFilesCount,
        storageFootprint: formatStorageFootprint(totalDriveStorageBytes),
        storageUsagePercent: Number(storageUsagePercent.toFixed(2)),
        storageCapacityBytes: STORAGE_BAR_CAP_BYTES,
      },
    });
  } catch (err) {
    log(`Error fetching user files dashboard: ${err.message}`, "error");
    return res.status(500).json({ error: "Failed to load files." });
  }
};

/**
 * Handles uploading one or more files into the active folder.
 */
export const uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ error: "No files were uploaded." });
    }

    const username = req.session.user;
    const parentFolder = req.body.parentFolder || "root";
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
        fileSizeBytes: fileSizeInBytes,
        parentFolder: parentFolder,
        isFolder: false
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
        fileSizeBytes: fileSizeInBytes,
        encryption: config.settings.encryption,
        parentFolder
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
        fileSizeBytes: fileSizeInBytes,
        parentFolder: "root",
        isFolder: false
      });
    }

    res.redirect("/dashboard");
  } catch (err) {
    log(`Webshare controller error: ${err.message}`, "error");
    res.status(500).render("error", { errorMessage: "Webshare upload failed." });
  }
};

/**
 * Helper recursively deleting folders and nested items.
 */
const deleteFolderRecursively = async (folderName, username, dataCollection) => {
  const items = await dataCollection.find({ uploader: username, parentFolder: folderName }).toArray();
  for (const item of items) {
    if (item.isFolder) {
      await deleteFolderRecursively(item.filename, username, dataCollection);
    } else {
      await purgeFile(item.filename);
    }
  }
  await dataCollection.deleteOne({ uploader: username, filename: folderName, isFolder: true });
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
    const item = await dataCollection.findOne({ filename: fileName, uploader: username });
    if (!item) {
      return res.status(404).json({ error: "Item not found or unauthorized." });
    }

    if (item.isFolder) {
      await deleteFolderRecursively(fileName, username, dataCollection);
    } else {
      await purgeFile(fileName);
    }

    return res.status(200).json({ success: true, message: "Item deleted successfully." });
  } catch (err) {
    log(`Delete controller error: ${err.message}`, "error");
    return res.status(500).json({ error: "Failed to delete item." });
  }
};

/**
 * Creates a virtual folder document.
 */
export const createFolder = async (req, res) => {
  try {
    const { folderName, parentFolder } = req.body;
    const username = req.session.user;
    
    if (!folderName || folderName.trim() === "") {
      return res.status(400).json({ error: "Folder name is required." });
    }

    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    const shortID = generateShortID();
    const folderFilename = `folder-${normalizeFileName(folderName)}-${shortID}`;

    const localDateTime = DateTime.local();
    const formattedOutput = `Date: ${localDateTime.toLocaleString(
      DateTime.DATE_FULL,
    )} Time: ${localDateTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`;

    const folderDoc = {
      filename: folderFilename,
      originalName: folderName.trim(),
      uploadTime: formattedOutput,
      uploader: username,
      isFolder: true,
      parentFolder: parentFolder || "root"
    };

    await dataCollection.insertOne(folderDoc);
    log(`Folder created successfully: ${folderName} by ${username}`, "info");

    return res.status(201).json({ success: true, folder: folderDoc });
  } catch (err) {
    log(`Folder creation controller error: ${err.message}`, "error");
    return res.status(500).json({ error: "Folder creation failed." });
  }
};

/**
 * Moves a file/folder to another parent folder.
 */
export const moveFile = async (req, res) => {
  try {
    const { fileName } = req.params;
    const { destinationFolder } = req.body;
    const username = req.session.user;
    
    if (!destinationFolder) {
      return res.status(400).json({ error: "Destination folder is required." });
    }

    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    const result = await dataCollection.updateOne(
      { filename: fileName, uploader: username },
      { $set: { parentFolder: destinationFolder } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Item not found or unauthorized." });
    }

    return res.status(200).json({ success: true, message: "Item migrated successfully." });
  } catch (err) {
    log(`Move item controller error: ${err.message}`, "error");
    return res.status(500).json({ error: "Failed to move item." });
  }
};

/**
 * Downloads a folder's files recursively zipped in memory.
 */
export const downloadFolderZip = async (req, res) => {
  try {
    const { folderName } = req.params;
    const db = await getDB();
    const dataCollection = db.collection("file_uploadData");

    // Find folder document
    const folderDoc = await dataCollection.findOne({ filename: folderName, isFolder: true });
    if (!folderDoc) {
      log(`ZIP generator: Folder ${folderName} not found in DB.`, "warn");
      return res.status(404).json({ error: "Folder not found." });
    }

    const filesToZip = [];
    
    // Traverse folders recursively
    const collectFiles = async (fName, currentPath) => {
      const items = await dataCollection.find({ parentFolder: fName }).toArray();
      for (const item of items) {
        if (item.isFolder) {
          await collectFiles(item.filename, `${currentPath}${item.originalName}/`);
        } else {
          filesToZip.push({
            doc: item,
            zipPath: `${currentPath}${item.originalName}`
          });
        }
      }
    };

    await collectFiles(folderName, "");

    if (filesToZip.length === 0) {
      return res.status(400).json({ error: "Folder is empty." });
    }

    const zip = new AdmZip();

    for (const fileItem of filesToZip) {
      const doc = fileItem.doc;
      
      let fileBuffer;
      try {
        fileBuffer = await storage.getFile(doc.filename);
      } catch (storageErr) {
        log(`ZIP generator: Storage retrieval error for ${doc.filename}: ${storageErr.message}`, "error");
        continue; 
      }

      let outputBuffer = fileBuffer;
      if (doc.encryption === "true") {
        try {
          outputBuffer = await decryptFile(doc.filename, fileBuffer);
        } catch (decryptErr) {
          log(`ZIP generator: Decryption error for ${doc.filename}: ${decryptErr.message}`, "error");
          continue; 
        }
      }

      zip.addFile(fileItem.zipPath, outputBuffer);
    }

    const zipBuffer = zip.toBuffer();

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folderDoc.originalName)}.zip"`);
    res.setHeader('Content-Type', 'application/zip');
    return res.send(zipBuffer);

  } catch (err) {
    log(`Folder ZIP download error: ${err.message}`, "error");
    if (!res.headersSent) {
      return res.status(500).json({ error: "Failed to generate ZIP archive." });
    }
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

    const fileData = await dataCollection.findOne({ filename: fileName });

    if (!fileData) {
      log(`File metadata not found for ${fileName} in DB.`, "warn");
      return res.status(404).json({ error: "File not found or metadata missing." });
    }

    const isFolder = fileData.isFolder === true || fileData.isFolder === "true";

    return res.status(200).json({
      success: true,
      fileName,
      originalName: fileData.originalName || fileName,
      uploadTime: fileData.uploadTime,
      uploader: fileData.uploader,
      fileSize: fileData.fileSize || (isFolder ? "Directory" : "0 KB"),
      encryption: fileData.encryption,
      isFolder,
      apiLink: isFolder ? `${config.settings.domain}/api/files/zip/${fileName}` : `${config.settings.domain}/cdn/${fileName}`,
      viewLink: isFolder ? `${config.settings.domain}/dashboard?folder=${fileName}` : `${config.settings.domain}/view/${fileName}`
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
      return res.status(404).json({ error: "File metadata missing." });
    }

    let fileBuffer;
    try {
      fileBuffer = await storage.getFile(fileName);
    } catch (storageErr) {
      log(`Storage retrieval error for ${fileName}: ${storageErr.message}`, "error");
      return res.status(404).json({ error: "File could not be retrieved from storage backend." });
    }

    let outputBuffer = fileBuffer;
    if (fileData.encryption === "true") {
      try {
        outputBuffer = await decryptFile(fileName, fileBuffer);
      } catch (decryptErr) {
        log(`Decryption error for ${fileName}: ${decryptErr.message}`, "error");
        return res.status(500).json({ error: "Error decrypting file." });
      }
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileData.originalName || fileName)}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.send(outputBuffer);

  } catch (err) {
    log(`CDN direct downloader error: ${err.message}`, "error");
    if (!res.headersSent) {
      return res.status(500).json({ error: "Error occurred while fetching download." });
    }
  }
};

// Tiny helper to parse file extensions safely
function pathExtension(filename) {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts.pop()}` : '';
}
