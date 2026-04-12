import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as calibrationService from "../services/calibration.service";

const router = Router();
router.use(authenticate);

const createCalibrationSchema = z.object({
  deviceId: z.string().uuid(),
  backgroundLuminanceCdm2: z.number().positive(),
  maxStimulusLuminanceCdm2: z.number().positive(),
  gammaCorrectionTable: z.array(z.number()).length(256),
  warmupDurationSeconds: z.number().nonnegative(),
});

router.post("/", validate(createCalibrationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cal = await calibrationService.createCalibration(req.body);
      res.status(201).json({ success: true, data: cal });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/latest/:deviceId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cal = await calibrationService.getLatestCalibration(req.params.deviceId);
    res.json({ success: true, data: cal });
  } catch (err) {
    next(err);
  }
});

export default router;
