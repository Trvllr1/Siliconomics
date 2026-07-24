import { describe, it, expect } from 'vitest';
import { SITE, HERO, PILLARS, ANTI_POSITIONING, WORKFLOW_STEPS, PARTNER_OFFER } from '../content/pages';
import { PLATFORM_SECTIONS, METHODOLOGY_SECTIONS } from '../content/pillars';
import { PRICING_FAQ } from '../content/faq';
import { INSIGHTS_INDEX } from '../content/insights';

describe('content integrity', () => {
  it('SITE has required fields', () => {
    expect(SITE.oneLiner).toBeTruthy();
    expect(SITE.name).toBeTruthy();
  });

  it('HERO has required fields', () => {
    expect(HERO.eyebrow).toBeTruthy();
    expect(HERO.headline).toBeTruthy();
    expect(HERO.microProof).toContain('Deterministic');
  });

  it('PILLARS has 4 entries', () => {
    expect(PILLARS.length).toBe(4);
  });

  it('ANTI_POSITIONING has 4 entries', () => {
    expect(ANTI_POSITIONING.length).toBe(4);
  });

  it('WORKFLOW_STEPS has 8 steps', () => {
    expect(WORKFLOW_STEPS.length).toBe(8);
  });

  it('PARTNER_OFFER has criteria and cta', () => {
    expect(PARTNER_OFFER.criteria.length).toBe(4);
    expect(PARTNER_OFFER.cta).toBeTruthy();
  });

  it('PLATFORM_SECTIONS has sections', () => {
    expect(PLATFORM_SECTIONS.length).toBeGreaterThan(0);
  });

  it('METHODOLOGY_SECTIONS has sections', () => {
    expect(METHODOLOGY_SECTIONS.length).toBeGreaterThan(0);
  });

  it('PRICING_FAQ has questions', () => {
    expect(PRICING_FAQ.length).toBeGreaterThan(0);
  });

  it('INSIGHTS_INDEX has at least one article', () => {
    expect(INSIGHTS_INDEX.length).toBeGreaterThan(0);
    expect(INSIGHTS_INDEX[0]!.slug).toBeTruthy();
    expect(INSIGHTS_INDEX[0]!.title).toBeTruthy();
  });
});
