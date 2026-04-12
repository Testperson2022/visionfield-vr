/**
 * Triage-badge med farvekode og anbefaling.
 * Normal=grøn, Borderline=gul, Abnormal=rød.
 */

interface TriageBadgeProps {
  classification: "normal" | "borderline" | "abnormal";
  recommendation?: string;
  showRecommendation?: boolean;
}

const config = {
  normal: {
    label: "Normal",
    bg: "bg-green-100 text-green-800 border-green-300",
    dot: "bg-green-500",
  },
  borderline: {
    label: "Grænseværdi",
    bg: "bg-yellow-100 text-yellow-800 border-yellow-300",
    dot: "bg-yellow-500",
  },
  abnormal: {
    label: "Unormal",
    bg: "bg-red-100 text-red-800 border-red-300",
    dot: "bg-red-500",
  },
};

export default function TriageBadge({
  classification,
  recommendation,
  showRecommendation = true,
}: TriageBadgeProps) {
  const c = config[classification];

  return (
    <div>
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium border ${c.bg}`}
      >
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        {c.label}
      </span>
      {showRecommendation && recommendation && (
        <p className="mt-2 text-sm text-gray-600">{recommendation}</p>
      )}
    </div>
  );
}
