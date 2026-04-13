/**
 * VisionField VR — PDF Report Service
 *
 * Server-side PDF-generering for synsfeltstest-resultater.
 * Ref: lessons.md — PDF genereres server-side (sikkerhed + memory).
 *
 * Indhold:
 * - Patientinfo (dekrypteret)
 * - Testdato, øje, protocol
 * - Globale indices (MD, PSD, GHT)
 * - Triage-klassifikation + anbefaling
 * - 24-2 synsfeltskort (numerisk grid)
 * - Kvalitetsmetrics
 *
 * SIKKERHED: PDF indeholder dekrypterede patientnavne — kun til autoriserede klinikere.
 */
import PDFDocument from "pdfkit";
import { decrypt } from "../utils/crypto";

interface ReportData {
  // Patient
  firstName: string;
  lastName: string;
  birthYear: number;
  // Session
  sessionId: string;
  eye: string;
  testDate: Date;
  protocolName: string;
  // Results
  pointResults: Array<{
    grid_point_id: number;
    threshold_db: number;
    total_deviation_db: number;
  }>;
  meanDeviationDb: number;
  patternSdDb: number;
  ght: string;
  triageClassification: string;
  triageRecommendation: string;
  // Quality
  falsePositiveRate: number;
  falseNegativeRate: number;
  fixationLossRate: number;
  testDurationSeconds: number;
  isReliable: boolean;
}

// 24-2 grid layout for numerisk visning (y-rækker fra top til bund)
const GRID_ROWS: Array<{ y: number; xValues: number[] }> = [
  { y: 21, xValues: [-21, -15, -9, -3] },
  { y: 15, xValues: [-21, -15, -9, -3, 3, 9, 15, 21] },
  { y: 9,  xValues: [-27, -21, -15, -9, -3, 3, 9, 15, 21, 27] },
  { y: 3,  xValues: [-27, -21, -15, -9, -3, 3, 9, 15, 21, 27] },
  { y: -9, xValues: [-27, -21, -15, -9, -3, 3, 9, 15, 21, 27] },
  { y: -15, xValues: [-21, -15, -9, -3, 3, 9, 15, 21] },
  { y: -21, xValues: [3, 9, 15, 21] },
];

export function generateReportPdf(data: ReportData): PDFKit.PDFDocument {
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  // ─── Header ──────────────────────────────────────────────────
  doc.fontSize(18).font("Helvetica-Bold").text("VisionField VR", { align: "center" });
  doc.fontSize(10).font("Helvetica").text("Synsfeltstest — Rapport", { align: "center" });
  doc.moveDown(1);

  // ─── Patientinfo ─────────────────────────────────────────────
  doc.fontSize(12).font("Helvetica-Bold").text("Patient");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Navn: ${data.firstName} ${data.lastName}`);
  doc.text(`Fødselsår: ${data.birthYear}`);
  doc.text(`Testdato: ${data.testDate.toLocaleDateString("da-DK")}`);
  doc.text(`Øje: ${data.eye === "OD" ? "Højre (OD)" : "Venstre (OS)"}`);
  doc.text(`Protocol: ${data.protocolName}`);
  doc.text(`Session: ${data.sessionId}`);
  doc.moveDown(1);

  // ─── Globale indices ─────────────────────────────────────────
  doc.fontSize(12).font("Helvetica-Bold").text("Globale indices");
  doc.fontSize(10).font("Helvetica");
  doc.text(`Mean Deviation (MD): ${data.meanDeviationDb.toFixed(1)} dB`);
  doc.text(`Pattern Standard Deviation (PSD): ${data.patternSdDb.toFixed(1)} dB`);
  if (data.ght) doc.text(`Glaucoma Hemifield Test (GHT): ${data.ght}`);
  doc.moveDown(0.5);

  // ─── Triage ──────────────────────────────────────────────────
  const triageLabel =
    data.triageClassification === "normal" ? "NORMAL" :
    data.triageClassification === "borderline" ? "GRAENSEVAERDI" : "UNORMAL";

  doc.fontSize(12).font("Helvetica-Bold").text(`Triage: ${triageLabel}`);
  doc.fontSize(10).font("Helvetica").text(data.triageRecommendation);
  doc.moveDown(1);

  // ─── Synsfeltskort (numerisk) ────────────────────────────────
  doc.fontSize(12).font("Helvetica-Bold").text("Synsfeltskort — Tærskelværdier (dB)");
  doc.moveDown(0.5);

  const resultMap = new Map(
    data.pointResults.map((p) => [`${findXDeg(p.grid_point_id)},${findYDeg(p.grid_point_id)}`, p])
  );

  doc.fontSize(8).font("Courier");
  for (const row of GRID_ROWS) {
    const indent = (10 - row.xValues.length) * 2;
    let line = " ".repeat(indent);
    for (const x of row.xValues) {
      const key = `${x},${row.y}`;
      const result = resultMap.get(key);
      if (result) {
        const val = Math.round(result.threshold_db);
        line += val.toString().padStart(4);
      } else {
        line += "  BS"; // Blind spot
      }
    }
    doc.text(line);
  }
  doc.moveDown(1);

  // ─── Kvalitetsmetrics ────────────────────────────────────────
  doc.fontSize(12).font("Helvetica-Bold").text("Kvalitetskontrol");
  doc.fontSize(10).font("Helvetica");
  doc.text(`False positive rate: ${(data.falsePositiveRate * 100).toFixed(0)}% (grænse: <20%)`);
  doc.text(`False negative rate: ${(data.falseNegativeRate * 100).toFixed(0)}% (grænse: <33%)`);
  doc.text(`Fixation loss rate: ${(data.fixationLossRate * 100).toFixed(0)}% (grænse: <20%)`);
  doc.text(`Testvarighed: ${Math.floor(data.testDurationSeconds / 60)}:${Math.floor(data.testDurationSeconds % 60).toString().padStart(2, "0")}`);
  doc.text(`Pålidelig: ${data.isReliable ? "Ja" : "NEJ — anbefal gentest"}`);
  doc.moveDown(1);

  // ─── Screening-opsummering ────────────────────────────────────
  doc.fontSize(12).font("Helvetica-Bold").fillColor("#000000").text("Screening-vurdering");
  doc.fontSize(10).font("Helvetica");
  doc.text(data.triageRecommendation);
  doc.moveDown(0.5);

  // Disclaimer
  doc.fontSize(8).font("Helvetica-Oblique").fillColor("#666666");
  doc.text(
    "SCREENING — IKKE DIAGNOSTISK SOFTWARE. " +
    "Dette resultat er et screenings- og beslutningsstoettevaerktoej. " +
    "Resultatet erstatter ikke en fuld klinisk undersoegelse og skal altid " +
    "vurderes af en kvalificeret fagperson."
  );
  doc.moveDown(1);

  // ─── Footer ──────────────────────────────────────────────────
  doc.fontSize(7).font("Helvetica").fillColor("#999999");
  doc.text(
    "Genereret af VisionField VR v1.0.0. " +
    "Screening- og beslutningsstoettevaerktoej. " +
    "Ikke certificeret diagnostisk medicinsk software.",
    50, doc.page.height - 50,
    { width: doc.page.width - 100, align: "center" }
  );

  doc.end();
  return doc;
}

/**
 * Byg ReportData fra database-objekter.
 * Dekrypterer patientnavne.
 */
export function buildReportData(
  patient: { first_name_encrypted: string; last_name_encrypted: string; birth_year: number },
  session: any
): ReportData {
  const results = session.results_json || {};

  return {
    firstName: decrypt(patient.first_name_encrypted),
    lastName: decrypt(patient.last_name_encrypted),
    birthYear: patient.birth_year,
    sessionId: session.id,
    eye: session.eye,
    testDate: new Date(session.started_at),
    protocolName: session.protocol_name,
    pointResults: results.point_results || [],
    meanDeviationDb: results.mean_deviation_db ?? 0,
    patternSdDb: results.pattern_sd_db ?? 0,
    ght: results.ght || "",
    triageClassification: results.triage_classification || "normal",
    triageRecommendation: results.triage_recommendation || "",
    falsePositiveRate: session.false_positive_rate ?? 0,
    falseNegativeRate: session.false_negative_rate ?? 0,
    fixationLossRate: session.fixation_loss_rate ?? 0,
    testDurationSeconds: session.test_duration_seconds ?? 0,
    isReliable: session.is_reliable ?? true,
  };
}

// Grid point ID → koordinat lookup (fra testGrid data)
const GRID_COORDS: Record<number, { x: number; y: number }> = {
  0:{x:-27,y:3},1:{x:-21,y:3},2:{x:-15,y:3},3:{x:-9,y:3},4:{x:-3,y:3},
  5:{x:3,y:3},6:{x:9,y:3},7:{x:15,y:3},8:{x:21,y:3},9:{x:27,y:3},
  10:{x:-27,y:9},11:{x:-21,y:9},12:{x:-15,y:9},13:{x:-9,y:9},14:{x:-3,y:9},
  15:{x:3,y:9},16:{x:9,y:9},17:{x:15,y:9},18:{x:21,y:9},19:{x:27,y:9},
  20:{x:-21,y:15},21:{x:-15,y:15},22:{x:-9,y:15},23:{x:-3,y:15},24:{x:3,y:15},
  25:{x:9,y:15},26:{x:15,y:15},27:{x:21,y:15},
  28:{x:-21,y:21},29:{x:-15,y:21},30:{x:-9,y:21},31:{x:-3,y:21},
  32:{x:3,y:-21},33:{x:9,y:-21},34:{x:15,y:-21},35:{x:21,y:-21},
  36:{x:-21,y:-15},37:{x:-15,y:-15},38:{x:-9,y:-15},39:{x:-3,y:-15},
  40:{x:3,y:-15},41:{x:9,y:-15},42:{x:15,y:-15},43:{x:21,y:-15},
  44:{x:-27,y:-9},45:{x:-21,y:-9},46:{x:-15,y:-9},47:{x:-9,y:-9},48:{x:-3,y:-9},
  49:{x:3,y:-9},50:{x:9,y:-9},51:{x:15,y:-9},52:{x:21,y:-9},53:{x:27,y:-9},
};

function findXDeg(pointId: number): number { return GRID_COORDS[pointId]?.x ?? 0; }
function findYDeg(pointId: number): number { return GRID_COORDS[pointId]?.y ?? 0; }
