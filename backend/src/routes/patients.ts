import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireRole } from "../middleware/auth";
import { validate } from "../middleware/validate";
import * as patientService from "../services/patient.service";

const router = Router();
router.use(authenticate);

const createPatientSchema = z.object({
  cpr: z.string().length(10),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  birthYear: z.number().int().min(1900).max(2030),
});

router.post("/", requireRole("ADMIN", "CLINICIAN"), validate(createPatientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await patientService.createPatient({
        ...req.body,
        clinicId: req.user!.clinicId,
      });
      res.status(201).json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const result = await patientService.listPatients(req.user!.clinicId, page, pageSize);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patient = await patientService.getPatientById(req.params.id, req.user!.clinicId);
    res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
});

router.post("/search", validate(z.object({ cpr: z.string().length(10) })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await patientService.findPatientByCpr(req.body.cpr, req.user!.clinicId);
      res.json({ success: true, data: patient });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
