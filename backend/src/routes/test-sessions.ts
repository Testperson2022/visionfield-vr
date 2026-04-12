import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { TestStatus } from "@prisma/client";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as sessionService from "../services/test-session.service";

const router = Router();
router.use(authenticate);

const createSessionSchema = z.object({
  patientId: z.string().uuid(),
  deviceId: z.string().uuid(),
  eye: z.enum(["OD", "OS"]),
  protocolName: z.string(),
  calibrationId: z.string().uuid(),
});

router.post("/", validate(createSessionSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.createSession({
        ...req.body,
        operatorId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await sessionService.getSession(req.params.id);
    res.json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", validate(z.object({ status: z.nativeEnum(TestStatus) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await sessionService.updateSessionStatus(req.params.id, req.body.status as TestStatus);
      res.json({ success: true, data: session });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/patient/:patientId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const result = await sessionService.listSessions(req.params.patientId, page);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

export default router;
