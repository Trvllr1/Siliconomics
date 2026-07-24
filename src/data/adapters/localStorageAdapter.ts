import type { Build, Decision, Comment, ActivityLog, Portfolio, Alert, ReferenceModel } from '../../types';
import type { StorageAdapter, SnapshotResponse } from './storageAdapter';

const KEYS = {
  builds: 'siliconomics_builds_v2',
  activities: 'siliconomics_activities_v2',
  customArchetypes: 'siliconomics_custom_archetypes_v2',
  decisions: 'siliconomics_decisions_v2',
  portfolios: 'siliconomics_portfolios_v2',
  alerts: 'siliconomics_alerts_v2',
  comments: 'siliconomics_comments_v2',
  customReferenceModels: 'siliconomics_custom_reference_models_v2',
};

function read<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, data: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn(`localStorage write failed for "${key}"`, err);
    return false;
  }
}

export const localStorageAdapter: StorageAdapter = {
  name: 'local',

  async getBuilds() { return read<Build[]>(KEYS.builds, []); },
  async getBuild(id: string) { const builds = read<Build[]>(KEYS.builds, []); return builds.find(b => b.id === id) ?? null; },
  async createBuild(build: Partial<Build>): Promise<Build> {
    const builds = read<Build[]>(KEYS.builds, []);
    const id = build.id || `build-${Date.now()}`;
    const newBuild: Build = { ...build as unknown as Build, id, createdDate: build.createdDate || new Date().toISOString() };
    write(KEYS.builds, [...builds, newBuild]);
    return newBuild;
  },
  async updateBuild(id: string, changes: Partial<Build>): Promise<Build> {
    const builds = read<Build[]>(KEYS.builds, []);
    const idx = builds.findIndex(b => b.id === id);
    if (idx === -1) throw new Error(`Build ${id} not found`);
    const updated: Build = { ...builds[idx]!, ...changes, id: builds[idx]!.id } as Build;
    builds[idx] = updated;
    write(KEYS.builds, builds);
    return updated;
  },
  async deleteBuild(id: string) {
    const builds = read<Build[]>(KEYS.builds, []);
    write(KEYS.builds, builds.filter(b => b.id !== id));
  },

  async transitionStatus(buildId: string) {
    const builds = read<Build[]>(KEYS.builds, []);
    const existing = builds.find(b => b.id === buildId);
    if (!existing) throw new Error(`Build ${buildId} not found`);

    const STATUS_FLOW: Record<string, string> = {
      Draft: 'TechnicalReview',
      TechnicalReview: 'FinancialReview',
      FinancialReview: 'ProgramReview',
      ProgramReview: 'Approved',
    };
    const nextStatus = STATUS_FLOW[existing.status];
    if (!nextStatus) throw new Error(`No transition from ${existing.status}`);

    return this.updateBuild(buildId, { status: nextStatus as Build['status'] });
  },

  async newVersion(sourceBuildId: string, newName?: string, changes?: Partial<Build>) {
    const source = await this.getBuild(sourceBuildId);
    if (!source) throw new Error(`Source build ${sourceBuildId} not found`);
    const verMatch = (source.version || 'v1.0').match(/^v?(\d+)\.(\d+)$/);
    const newVersion = verMatch ? `v${verMatch[1]!}.${parseInt(verMatch[2]!) + 1}` : 'v1.1';
    return this.createBuild({
      ...source,
      ...changes,
      id: `build-${Date.now()}`,
      name: newName || `Copy of ${source.name}`,
      version: newVersion,
      parentId: source.id,
      status: 'Draft',
      createdDate: new Date().toISOString(),
    });
  },

  async getDecisions() { return read<Decision[]>(KEYS.decisions, []); },
  async recordDecision(decision: Omit<Decision, 'id' | 'timestamp'>) {
    const decisions = read<Decision[]>(KEYS.decisions, []);
    const newDecision: Decision = { ...decision, id: `dec-${Date.now()}`, timestamp: new Date().toISOString() };
    write(KEYS.decisions, [newDecision, ...decisions]);
    return newDecision;
  },

  async getComments(buildId: string) {
    const all = read<Comment[]>('siliconomics_comments_v2', []);
    return all.filter(c => c.buildId === buildId);
  },
  async addComment(buildId: string, elementId: string | null, content: string, authorName: string, authorRole: string, versionStamp?: string) {
    const all = read<Comment[]>('siliconomics_comments_v2', []);
    const comment: Comment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      buildId,
      elementId: elementId || undefined,
      author: authorName,
      role: authorRole,
      content,
      timestamp: new Date().toISOString(),
      versionStamp: versionStamp || '',
    };
    write('siliconomics_comments_v2', [...all, comment]);
    return comment;
  },

  async getActivities() { return read<ActivityLog[]>(KEYS.activities, []); },
  async addActivity(activity: ActivityLog) {
    const activities = read<ActivityLog[]>(KEYS.activities, []);
    write(KEYS.activities, [activity, ...activities]);
  },
  async setActivities(activities: ActivityLog[]) { write(KEYS.activities, activities); },

  async getPortfolios() { return read<Portfolio[]>(KEYS.portfolios, []); },
  async savePortfolios(portfolios: Portfolio[]) { write(KEYS.portfolios, portfolios); return portfolios; },

  async getAlerts() { return read<Alert[]>(KEYS.alerts, []); },
  async saveAlerts(alerts: Alert[]) { write(KEYS.alerts, alerts); },

  async getCustomArchetypes() { return read<any[]>(KEYS.customArchetypes, []); },
  async saveCustomArchetypes(archetypes: any[]) { write(KEYS.customArchetypes, archetypes); },

  async getCustomReferenceModels() { return read<ReferenceModel[]>(KEYS.customReferenceModels, []); },
  async saveCustomReferenceModels(models: ReferenceModel[]) { write(KEYS.customReferenceModels, models); },

  async getSnapshots(_buildId: string): Promise<SnapshotResponse[]> { return []; },
};
