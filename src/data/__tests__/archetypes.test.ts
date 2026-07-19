import { describe, it, expect } from 'vitest';
import { createBlankBuild } from '../archetypes';
import { computeBuildMetrics } from '../../utils/mathEngine';

describe('createBlankBuild', () => {
  it('creates a root Draft build with a complete, finite DesignModel', () => {
    const b = createBlankBuild('Test Chip', 'tester');
    expect(b.name).toBe('Test Chip');
    expect(b.creator).toBe('tester');
    expect(b.status).toBe('Draft');
    expect(b.version).toBe('v1.0');
    expect(b.parentId).toBeUndefined();
    expect(b.id).toMatch(/^build-/);
    for (const [field, value] of Object.entries(b.designModel)) {
      if (typeof value === 'number') {
        expect(Number.isFinite(value), `designModel.${field} must be finite`).toBe(true);
      }
    }
  });

  it('falls back to Untitled Build name and default creator', () => {
    const b = createBlankBuild('', '');
    expect(b.name).toBe('Untitled Build');
    expect(b.creator).toBe('eagleximpact');
  });

  it('generates unique ids across calls', () => {
    expect(createBlankBuild('A', 't').id).not.toBe(createBlankBuild('B', 't').id);
  });

  it('runs through the deterministic engine with sane outputs', () => {
    const { snapshot } = computeBuildMetrics(createBlankBuild('Engine Check', 'tester'));
    expect(Number.isFinite(snapshot.grossMargin)).toBe(true);
    expect(snapshot.dieYield).toBeGreaterThan(0);
    expect(snapshot.dieYield).toBeLessThanOrEqual(1);
    expect(snapshot.dpw).toBeGreaterThan(0);
  });
});
