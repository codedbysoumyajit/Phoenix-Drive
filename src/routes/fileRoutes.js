import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { rateLimiter } from "../middleware/rateLimiter.js";
import {
  renderUploadPage,
  uploadFile,
  webshareUploadFile,
  renderDownloadPage,
  cdnFile,
  renderViewPage,
  deleteFile,
} from "../controllers/fileController.js";

const router = Router();

const uploadLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,                  // Max 50 uploads per window
  message: "Too many uploads. Please wait a few minutes before trying again."
});

router.get("/upload", authenticate, renderUploadPage);
router.post("/upload", authenticate, uploadLimiter, uploadFile);
router.post("/webshare", authenticate, uploadLimiter, webshareUploadFile);
router.get("/download/:fileName", renderDownloadPage);
router.get("/cdn/:fileName", cdnFile);
router.get("/view/:fileName", renderViewPage);
router.post("/delete/:fileName", authenticate, deleteFile);

export default router;
