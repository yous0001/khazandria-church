import { Router } from "express";
import { activityMembershipController } from "./activityMembership.controller";
import { checkAuth } from "../../middlewares/checkAuth";
import { checkActivityPermission } from "../../middlewares/activityPermission";

const router = Router();

router.use(checkAuth);

// POST /api/activities/:activityId/admins (head or superadmin)
router.post(
  "/:activityId/admins",
  checkActivityPermission("params", "head"),
  activityMembershipController.addAdmin
);

// DELETE /api/activities/:activityId/admins/:userId (head or superadmin)
router.delete(
  "/:activityId/admins/:userId",
  checkActivityPermission("params", "head"),
  activityMembershipController.removeAdmin
);

// GET /api/activities/:activityId/admins (member)
router.get(
  "/:activityId/admins",
  checkActivityPermission("params", "member"),
  activityMembershipController.getActivityAdmins
);

export default router;
