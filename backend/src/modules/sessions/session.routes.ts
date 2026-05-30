import { Router } from "express";
import { sessionController } from "./session.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireSuperAdmin } from "../../middlewares/requireRole";
import { checkGroupPermission } from "../../middlewares/groupPermission";
import { checkSessionPermission } from "../../middlewares/sessionPermission";
import { upload } from "../../middlewares/upload";

const router = Router();

router.use(checkAuth);

// POST /api/groups/:groupId/sessions (member)
router.post(
  "/:groupId/sessions",
  checkGroupPermission("member"),
  sessionController.createSession
);

// GET /api/groups/:groupId/sessions (member)
router.get(
  "/:groupId/sessions",
  checkGroupPermission("member"),
  sessionController.getSessionsByGroup
);

// POST /api/sessions/:sessionId/attendance-pdf/generate (member)
router.post(
  "/:sessionId/attendance-pdf/generate",
  checkSessionPermission("member"),
  sessionController.generateAttendancePdf
);

// GET /api/sessions/:sessionId/attendance-pdf/download (member)
router.get(
  "/:sessionId/attendance-pdf/download",
  checkSessionPermission("member"),
  sessionController.downloadAttendancePdf
);

// GET /api/sessions/:sessionId (member)
router.get(
  "/:sessionId",
  checkSessionPermission("member"),
  sessionController.getSessionById
);

// PATCH /api/sessions/:sessionId/students/:studentId (member)
router.patch(
  "/:sessionId/students/:studentId",
  checkSessionPermission("member"),
  sessionController.updateSessionStudent
);

// DELETE /api/sessions/:sessionId (superadmin only)
router.delete(
  "/:sessionId",
  requireSuperAdmin,
  sessionController.deleteSession
);

// PATCH /api/sessions/:sessionId/content (member)
router.patch(
  "/:sessionId/content",
  checkSessionPermission("member"),
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "videos", maxCount: 10 },
    { name: "pdfs", maxCount: 10 },
  ]),
  sessionController.updateSessionContent
);

export default router;
