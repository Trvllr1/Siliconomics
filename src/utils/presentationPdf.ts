import { jsPDF } from 'jspdf';
import type { Build, Decision, Snapshot } from '../types';
import type { BusinessImpact } from './BusinessImpact';
import type { RecommendationDetail } from './ExecutiveRecommendation';

const WIDTH = 960;
const HEIGHT = 540;
const MARGIN = 54;
const CONTENT_WIDTH = WIDTH - MARGIN * 2;

type Rgb = [number, number, number];

const INK: Rgb = [5, 10, 8];
const SURFACE: Rgb = [15, 25, 20];
const PANEL: Rgb = [22, 36, 29];
const TEXT: Rgb = [235, 242, 238];
const MUTED: Rgb = [164, 180, 171];
const TEAL: Rgb = [0, 191, 166];
const GREEN: Rgb = [34, 197, 94];
const AMBER: Rgb = [245, 158, 11];
const RED: Rgb = [239, 68, 68];

export interface PresentationPdfInput {
  build: Build;
  snapshot: Snapshot;
  recommendation: RecommendationDetail;
  comparisonBuild: Build;
  comparisonSnapshot: Snapshot;
  comparisonRecommendation: RecommendationDetail;
  impacts: BusinessImpact[];
  decisions: Decision[];
}

function outcomeTone(outcome: string): Rgb {
  if (outcome === 'Proceed') return GREEN;
  if (outcome === 'Proceed with Risk' || outcome === 'Requires Investigation') return AMBER;
  return RED;
}

function riskScore(input: PresentationPdfInput) {
  const { build, snapshot } = input;
  return [
    ['Manufacturing', Math.round((100 - snapshot.dieYield * 100) / 10), `Die yield ${(snapshot.dieYield * 100).toFixed(1)}%`],
    ['Financial', Math.round(Math.max(0, 10 - (snapshot.grossMargin > 40 ? 5 : snapshot.grossMargin > 20 ? 3 : 0) - (snapshot.roi > 30 ? 3 : 0) - (snapshot.breakEvenVolumeMillion < 3 ? 2 : 0))), `${snapshot.grossMargin.toFixed(1)}% margin`],
    ['Supply chain', Math.round(snapshot.supplyChain.compositeRiskScore / 10), snapshot.supplyChain.riskLevel],
    ['Technology', build.designModel.topology === 'chiplet' ? 5 : build.designModel.defectDensity > 0.3 ? 7 : 3, build.designModel.processNode],
    ['Packaging', build.designModel.packagingType !== 'standard' ? Math.round((100 - build.designModel.packagingYield) / 5) : Math.round((100 - build.designModel.packagingYield) / 10), build.designModel.packagingType],
  ] as const;
}

function scorecard(build: Build, snapshot: Snapshot) {
  return [
    ['Technical feasibility', Math.round(Math.min(10, (snapshot.dieYield / 0.95) * 3 + (snapshot.transistorDensity > 50 ? 4 : 2) + (snapshot.dpw > 200 ? 3 : 1)))],
    ['Manufacturing readiness', Math.round(Math.min(10, (build.designModel.packagingYield / 99) * 4 + (build.designModel.testYield / 99) * 3 + (snapshot.dieYield > 0.6 ? 3 : 0)))],
    ['Capital efficiency', Math.round(Math.min(10, (snapshot.roi > 50 ? 5 : snapshot.roi > 20 ? 3 : 1) + (snapshot.breakEvenVolumeMillion < 2 ? 3 : snapshot.breakEvenVolumeMillion < 5 ? 2 : 0) + (build.designModel.nreCost < 50 ? 2 : 0)))],
    ['Commercial attractiveness', Math.round(Math.min(10, (snapshot.grossMargin > 60 ? 5 : snapshot.grossMargin > 35 ? 3 : 1) + (snapshot.lifetimeNetProfitMillion > 200 ? 3 : snapshot.lifetimeNetProfitMillion > 0 ? 1 : 0) + (build.designModel.asp > 500 ? 2 : 0)))],
    ['Program confidence', Math.round(Math.min(10, (snapshot.grossMargin > 40 ? 3 : 1) + (snapshot.roi > 30 ? 3 : 1) + (snapshot.breakEvenVolumeMillion < 3 ? 4 : 2)))],
    ['Supply-chain resilience', Math.round(Math.min(10, 10 - Math.round(snapshot.supplyChain.compositeRiskScore / 10)))],
    ['Schedule confidence', Math.round(Math.min(10, (build.designModel.packagingYield > 97 ? 3 : 1) + (build.designModel.testYield > 97 ? 3 : 1) + (snapshot.breakEvenVolumeMillion < 4 ? 4 : 2)))],
  ] as const;
}

export function presentationFilename(build: Build): string {
  const slug = `${build.name}-${build.version}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `siliconomics-presentation-${slug}-${new Date().toISOString().slice(0, 10)}.pdf`;
}

export function generatePresentationPdf(input: PresentationPdfInput): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [WIDTH, HEIGHT] });
  let slide = 0;

  const text = (value: string, x: number, y: number, size = 12, color: Rgb = TEXT, style: 'normal' | 'bold' = 'normal', maxWidth?: number) => {
    doc.setFont('helvetica', style);
    doc.setFontSize(size);
    doc.setTextColor(...color);
    if (maxWidth) {
      doc.text(doc.splitTextToSize(value, maxWidth), x, y);
    } else {
      doc.text(value, x, y);
    }
  };

  const startSlide = (title: string, subtitle: string) => {
    if (slide > 0) doc.addPage();
    slide += 1;
    doc.setFillColor(...INK);
    doc.rect(0, 0, WIDTH, HEIGHT, 'F');
    doc.setFillColor(...TEAL);
    doc.rect(0, 0, WIDTH, 6, 'F');
    text('SILICONOMICS', MARGIN, 33, 10, TEAL, 'bold');
    text('MEETING MODE', WIDTH - MARGIN, 33, 8, MUTED, 'bold');
    text(title, MARGIN, 82, 27, TEXT, 'bold');
    text(subtitle, MARGIN, 106, 11, MUTED, 'normal');
    doc.setDrawColor(56, 76, 65);
    doc.line(MARGIN, 124, WIDTH - MARGIN, 124);
    text(`${slide} / 7`, WIDTH - MARGIN, HEIGHT - 24, 8, MUTED, 'normal');
  };

  const panel = (x: number, y: number, width: number, height: number) => {
    doc.setFillColor(...PANEL);
    doc.setDrawColor(53, 76, 64);
    doc.roundedRect(x, y, width, height, 8, 8, 'FD');
  };

  const metric = (label: string, value: string, x: number, y: number, width: number, tone: Rgb = TEXT) => {
    panel(x, y, width, 86);
    text(label.toUpperCase(), x + 16, y + 25, 8, MUTED, 'bold');
    text(value, x + 16, y + 62, 23, tone, 'bold');
  };

  const bullet = (value: string, x: number, y: number, width: number, tone: Rgb = TEAL) => {
    doc.setFillColor(...tone);
    doc.circle(x + 4, y - 4, 3, 'F');
    text(value, x + 16, y, 10.5, TEXT, 'normal', width - 16);
  };

  startSlide('Program presentation', `${input.build.name} · ${input.build.designModel.processNode} ${input.build.designModel.topology} · ${input.build.version}`);
  const cardWidth = (CONTENT_WIDTH - 36) / 4;
  metric('Die yield', `${(input.snapshot.dieYield * 100).toFixed(1)}%`, MARGIN, 158, cardWidth, TEAL);
  metric('Gross margin', `${input.snapshot.grossMargin.toFixed(1)}%`, MARGIN + cardWidth + 12, 158, cardWidth, GREEN);
  metric('Lifetime net profit', `$${input.snapshot.lifetimeNetProfitMillion.toFixed(0)}M`, MARGIN + (cardWidth + 12) * 2, 158, cardWidth);
  metric('ROI', `${input.snapshot.roi.toFixed(0)}%`, MARGIN + (cardWidth + 12) * 3, 158, cardWidth, TEAL);
  panel(MARGIN, 274, CONTENT_WIDTH, 172);
  const recommendationTone = outcomeTone(input.recommendation.outcome);
  text('CURRENT DETERMINISTIC RECOMMENDATION', MARGIN + 24, 307, 9, MUTED, 'bold');
  text(input.recommendation.outcome, MARGIN + 24, 356, 34, recommendationTone, 'bold');
  text(`Confidence: ${input.recommendation.confidence}%`, MARGIN + 24, 382, 12, TEXT, 'bold');
  text(input.recommendation.summary, MARGIN + 24, 416, 13, TEXT, 'normal', CONTENT_WIDTH - 48);

  startSlide('Risk dashboard', `${input.build.name} · category-level exposure`);
  riskScore(input).forEach(([label, value, detail], index) => {
    const x = MARGIN + (index % 3) * ((CONTENT_WIDTH - 24) / 3 + 12);
    const y = 158 + Math.floor(index / 3) * 142;
    const width = (CONTENT_WIDTH - 24) / 3;
    const tone = value >= 7 ? RED : value >= 4 ? AMBER : GREEN;
    panel(x, y, width, 118);
    text(label, x + 16, y + 26, 11, TEXT, 'bold');
    text(`${value} / 10`, x + 16, y + 62, 24, tone, 'bold');
    text(detail, x + 16, y + 88, 10, MUTED);
  });
  if (input.recommendation.riskFactors.length > 0) {
    text('Key risk factors', MARGIN, 460, 10, MUTED, 'bold');
    input.recommendation.riskFactors.slice(0, 2).forEach((factor, index) => bullet(factor, MARGIN, 484 + index * 20, CONTENT_WIDTH, AMBER));
  }

  startSlide('Gate review', `${input.build.name} · evidence-led recommendation`);
  panel(MARGIN, 154, CONTENT_WIDTH, 102);
  text(input.recommendation.outcome, MARGIN + 24, 199, 27, recommendationTone, 'bold');
  text(input.recommendation.summary, MARGIN + 24, 229, 11, TEXT, 'normal', CONTENT_WIDTH - 48);
  panel(MARGIN, 278, (CONTENT_WIDTH - 16) / 2, 196);
  panel(MARGIN + (CONTENT_WIDTH - 16) / 2 + 16, 278, (CONTENT_WIDTH - 16) / 2, 196);
  text('Supporting evidence', MARGIN + 18, 306, 11, TEXT, 'bold');
  input.recommendation.supportingEvidence.slice(0, 6).forEach((item, index) => bullet(item, MARGIN + 18, 333 + index * 22, (CONTENT_WIDTH - 16) / 2 - 36, GREEN));
  text('Risk factors', MARGIN + (CONTENT_WIDTH - 16) / 2 + 34, 306, 11, TEXT, 'bold');
  if (input.recommendation.riskFactors.length === 0) {
    text('No material risk factors detected.', MARGIN + (CONTENT_WIDTH - 16) / 2 + 34, 338, 11, MUTED, 'normal');
  } else {
    input.recommendation.riskFactors.slice(0, 6).forEach((item, index) => bullet(item, MARGIN + (CONTENT_WIDTH - 16) / 2 + 34, 333 + index * 22, (CONTENT_WIDTH - 16) / 2 - 52, AMBER));
  }

  startSlide('Build comparison', `${input.build.name} compared with ${input.comparisonBuild.name}`);
  const comparisonRows = [
    ['Die yield', `${(input.snapshot.dieYield * 100).toFixed(1)}%`, `${(input.comparisonSnapshot.dieYield * 100).toFixed(1)}%`],
    ['Gross margin', `${input.snapshot.grossMargin.toFixed(1)}%`, `${input.comparisonSnapshot.grossMargin.toFixed(1)}%`],
    ['ROI', `${input.snapshot.roi.toFixed(1)}%`, `${input.comparisonSnapshot.roi.toFixed(1)}%`],
    ['Break-even volume', `${input.snapshot.breakEvenVolumeMillion.toFixed(2)}M`, `${input.comparisonSnapshot.breakEvenVolumeMillion.toFixed(2)}M`],
    ['Lifetime net profit', `$${input.snapshot.lifetimeNetProfitMillion.toFixed(0)}M`, `$${input.comparisonSnapshot.lifetimeNetProfitMillion.toFixed(0)}M`],
    ['Unit COGS', `$${input.snapshot.grossCostPerGoodDie.toFixed(2)}`, `$${input.comparisonSnapshot.grossCostPerGoodDie.toFixed(2)}`],
  ];
  text(input.build.name, MARGIN + 340, 150, 10, TEAL, 'bold');
  text(input.comparisonBuild.name, MARGIN + 600, 150, 10, [96, 165, 250], 'bold');
  comparisonRows.forEach(([label, primary, secondary], index) => {
    const y = 184 + index * 47;
    panel(MARGIN, y - 24, CONTENT_WIDTH, 36);
    text(label.toUpperCase(), MARGIN + 16, y, 9, MUTED, 'bold');
    text(primary, MARGIN + 340, y, 13, TEXT, 'bold');
    text(secondary, MARGIN + 600, y, 13, TEXT, 'bold');
  });

  startSlide('Business impact', `${input.build.name} versus ${input.comparisonBuild.name}`);
  if (input.impacts.length === 0) {
    text('No material differences detected between the selected Builds.', MARGIN, 184, 14, MUTED, 'normal');
  } else {
    input.impacts.slice(0, 6).forEach((impact, index) => {
      const y = 156 + index * 57;
      panel(MARGIN, y, CONTENT_WIDTH, 44);
      const tone = impact.severity === 'positive' ? GREEN : impact.severity === 'negative' ? RED : MUTED;
      text(impact.category.toUpperCase(), MARGIN + 16, y + 18, 8, tone, 'bold');
      text(impact.metric, MARGIN + 145, y + 18, 10.5, TEXT, 'bold');
      text(impact.delta, WIDTH - MARGIN - 16, y + 18, 10, tone, 'bold');
      text(impact.narrative, MARGIN + 16, y + 35, 9.5, MUTED, 'normal', CONTENT_WIDTH - 32);
    });
  }

  startSlide('Executive decision scorecard', `${input.build.name} versus ${input.comparisonBuild.name}`);
  scorecard(input.build, input.snapshot).forEach(([label, primary], index) => {
    const secondary = scorecard(input.comparisonBuild, input.comparisonSnapshot)[index]![1];
    const y = 158 + index * 45;
    text(label, MARGIN, y, 10, TEXT, 'bold');
    doc.setFillColor(42, 80, 69);
    doc.roundedRect(MARGIN + 205, y - 12, 250, 14, 3, 3, 'F');
    doc.setFillColor(...TEAL);
    doc.roundedRect(MARGIN + 205, y - 12, 250 * (primary / 10), 14, 3, 3, 'F');
    doc.setFillColor(42, 80, 69);
    doc.roundedRect(MARGIN + 535, y - 12, 250, 14, 3, 3, 'F');
    doc.setFillColor(96, 165, 250);
    doc.roundedRect(MARGIN + 535, y - 12, 250 * (secondary / 10), 14, 3, 3, 'F');
    text(`${primary}/10`, MARGIN + 463, y, 9, TEAL, 'bold');
    text(`${secondary}/10`, MARGIN + 793, y, 9, [96, 165, 250], 'bold');
  });
  text(input.build.name, MARGIN + 205, 486, 9, TEAL, 'bold');
  text(input.comparisonBuild.name, MARGIN + 535, 486, 9, [96, 165, 250], 'bold');

  startSlide('Decision log', `${input.build.name} · recorded decisions`);
  const relevantDecisions = input.decisions.filter((decision) => decision.buildIds.includes(input.build.id));
  if (relevantDecisions.length === 0) {
    text('No decisions have been recorded for this Build.', MARGIN, 184, 14, MUTED, 'normal');
  } else {
    relevantDecisions.slice(0, 5).forEach((decision, index) => {
      const y = 158 + index * 68;
      panel(MARGIN, y, CONTENT_WIDTH, 56);
      const tone = outcomeTone(decision.outcome);
      text(decision.outcome.toUpperCase(), MARGIN + 16, y + 21, 10, tone, 'bold');
      text(`${decision.approver} · ${new Date(decision.timestamp).toLocaleDateString()}`, MARGIN + 16, y + 40, 9, MUTED);
      text(decision.rationale || 'No rationale recorded.', MARGIN + 250, y + 22, 10, TEXT, 'normal', CONTENT_WIDTH - 270);
    });
  }

  return doc;
}

export function downloadPresentationPdf(input: PresentationPdfInput): void {
  generatePresentationPdf(input).save(presentationFilename(input.build));
}
