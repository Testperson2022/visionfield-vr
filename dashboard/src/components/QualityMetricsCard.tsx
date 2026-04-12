/**
 * Kvalitetsmetrics-kort: FP%, FN%, fixation loss, reliabilitet.
 */
import { formatDuration } from "../utils/chartHelpers";

interface QualityMetricsCardProps {
  falsePositiveRate: number;
  falseNegativeRate: number;
  fixationLossRate: number;
  testDurationSeconds: number;
  isReliable: boolean;
  reliabilityIssues: string[];
}

function MetricRow({ label, value, threshold, isOver }: {
  label: string; value: string; threshold: string; isOver: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-mono ${isOver ? "text-red-600 font-bold" : "text-gray-900"}`}>
        {value} <span className="text-gray-400 text-xs">({threshold})</span>
      </span>
    </div>
  );
}

export default function QualityMetricsCard(props: QualityMetricsCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Kvalitetskontrol</h3>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
          props.isReliable
            ? "bg-green-100 text-green-700"
            : "bg-red-100 text-red-700"
        }`}>
          {props.isReliable ? "Pålidelig" : "Upålidelig"}
        </span>
      </div>

      <div className="space-y-1 divide-y divide-gray-100">
        <MetricRow
          label="False positives"
          value={`${(props.falsePositiveRate * 100).toFixed(0)}%`}
          threshold="<20%"
          isOver={props.falsePositiveRate >= 0.20}
        />
        <MetricRow
          label="False negatives"
          value={`${(props.falseNegativeRate * 100).toFixed(0)}%`}
          threshold="<33%"
          isOver={props.falseNegativeRate >= 0.33}
        />
        <MetricRow
          label="Fixation loss"
          value={`${(props.fixationLossRate * 100).toFixed(0)}%`}
          threshold="<20%"
          isOver={props.fixationLossRate >= 0.20}
        />
        <MetricRow
          label="Varighed"
          value={formatDuration(props.testDurationSeconds)}
          threshold=""
          isOver={false}
        />
      </div>

      {props.reliabilityIssues.length > 0 && (
        <div className="mt-3 p-2 bg-red-50 rounded text-xs text-red-700">
          {props.reliabilityIssues.map((issue, i) => (
            <p key={i}>{issue}</p>
          ))}
        </div>
      )}
    </div>
  );
}
