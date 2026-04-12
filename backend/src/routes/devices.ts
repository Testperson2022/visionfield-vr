import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as deviceService from "../services/device.service";

const router = Router();
router.use(authenticate);

const registerDeviceSchema = z.object({
  model: z.string(),
  serial: z.string(),
  firmware: z.string(),
});

router.post("/", validate(registerDeviceSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const device = await deviceService.registerDevice(
        req.user!.clinicId, req.body.model, req.body.serial, req.body.firmware
      );
      res.status(201).json({ success: true, data: device });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const devices = await deviceService.listDevices(req.user!.clinicId);
    res.json({ success: true, data: devices });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const device = await deviceService.updateDevice(req.params.id, req.body);
    res.json({ success: true, data: device });
  } catch (err) {
    next(err);
  }
});

export default router;
