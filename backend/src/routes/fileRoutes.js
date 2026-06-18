import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import {
  getUserFiles,
  uploadFile,
  webshareUploadFile,
  getFileMetadata,
  cdnFile,
  deleteFile,
  createFolder,
  moveFile,
  downloadFolderZip,
} from "../controllers/fileController.js";

const router = Router();

const uploadLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                  // Max 50 uploads per window
  message: "Too many uploads. Please wait a few minutes before trying again."
});

// Mounted at /api/files in index.js
router.get("/", authenticate, getUserFiles);
router.post("/upload", authenticate, uploadLimiter, uploadFile);
router.post("/webshare", authenticate, uploadLimiter, webshareUploadFile);
router.get("/metadata/:fileName", getFileMetadata);
router.get("/cdn/:fileName", cdnFile);
router.post("/delete/:fileName", authenticate, deleteFile);
router.post("/folder", authenticate, createFolder);
router.post("/move/:fileName", authenticate, moveFile);
router.get("/zip/:folderName", downloadFolderZip);

export default router;


