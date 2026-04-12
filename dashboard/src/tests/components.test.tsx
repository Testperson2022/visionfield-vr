import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TriageBadge from "../components/TriageBadge";
import QualityMetricsCard from "../components/QualityMetricsCard";

describe("TriageBadge", () => {
  it("renders 'Normal' for normal classification", () => {
    render(<TriageBadge classification="normal" />);
    expect(screen.getByText("Normal")).toBeDefined();
  });

  it("renders 'Grænseværdi' for borderline classification", () => {
    render(<TriageBadge classification="borderline" />);
    expect(screen.getByText("Grænseværdi")).toBeDefined();
  });

  it("renders 'Unormal' for abnormal classification", () => {
    render(<TriageBadge classification="abnormal" />);
    expect(screen.getByText("Unormal")).toBeDefined();
  });

  it("shows recommendation when provided", () => {
    render(
      <TriageBadge
        classification="abnormal"
        recommendation="Henvisning til øjenlæge inden 4 uger"
      />
    );
    expect(screen.getByText("Henvisning til øjenlæge inden 4 uger")).toBeDefined();
  });

  it("hides recommendation when showRecommendation is false", () => {
    render(
      <TriageBadge
        classification="normal"
        recommendation="Genscreening om 12 mdr"
        showRecommendation={false}
      />
    );
    expect(screen.queryByText("Genscreening om 12 mdr")).toBeNull();
  });
});

describe("QualityMetricsCard", () => {
  const reliableProps = {
    falsePositiveRate: 0.05,
    falseNegativeRate: 0.10,
    fixationLossRate: 0.08,
    testDurationSeconds: 240,
    isReliable: true,
    reliabilityIssues: [],
  };

  const unreliableProps = {
    falsePositiveRate: 0.25,
    falseNegativeRate: 0.35,
    fixationLossRate: 0.22,
    testDurationSeconds: 300,
    isReliable: false,
    reliabilityIssues: ["FP over grænse", "FN over grænse"],
  };

  it("shows 'Pålidelig' for reliable test", () => {
    render(<QualityMetricsCard {...reliableProps} />);
    expect(screen.getByText("Pålidelig")).toBeDefined();
  });

  it("shows 'Upålidelig' for unreliable test", () => {
    render(<QualityMetricsCard {...unreliableProps} />);
    expect(screen.getByText("Upålidelig")).toBeDefined();
  });

  it("displays false positive rate", () => {
    render(<QualityMetricsCard {...reliableProps} />);
    expect(screen.getByText("5%")).toBeDefined();
  });

  it("displays reliability issues when present", () => {
    render(<QualityMetricsCard {...unreliableProps} />);
    expect(screen.getByText("FP over grænse")).toBeDefined();
    expect(screen.getByText("FN over grænse")).toBeDefined();
  });

  it("displays formatted duration", () => {
    render(<QualityMetricsCard {...reliableProps} />);
    expect(screen.getByText("4:00")).toBeDefined();
  });
});
