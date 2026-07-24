import type { Build, Decision, Comment, ActivityLog, Portfolio, Alert, ReferenceModel } from '../../types';
import type { Archetype } from '../archetypes';

export interface SnapshotResponse {
  id: string;
  buildId: string;
  snapshot: any;
  contentHash: string;
  createdAt: string;
}

export interface StorageAdapter {
  name: 'local' | 'api';

  // Builds
  getBuilds(): Promise<Build[]>;
  getBuild(id: string): Promise<Build | null>;
  createBuild(build: Partial<Build>): Promise<Build>;
  updateBuild(id: string, changes: Partial<Build>): Promise<Build>;
  deleteBuild(id: string): Promise<void>;

  // Status transitions
  transitionStatus(buildId: string): Promise<Build>;

  // New version (fork from frozen)
  newVersion(sourceBuildId: string, newName?: string, changes?: Partial<Build>): Promise<Build>;

  // Decisions
  getDecisions(): Promise<Decision[]>;
  recordDecision(decision: Omit<Decision, 'id' | 'timestamp'>): Promise<Decision>;

  // Comments
  getComments(buildId: string): Promise<Comment[]>;
  addComment(buildId: string, elementId: string | null, content: string, authorName: string, authorRole: string, versionStamp?: string): Promise<Comment>;

  // Activities
  getActivities(): Promise<ActivityLog[]>;
  addActivity(activity: ActivityLog): Promise<void>;
  setActivities(activities: ActivityLog[]): Promise<void>;

  // Portfolios
  getPortfolios(): Promise<Portfolio[]>;
  savePortfolios(portfolios: Portfolio[]): Promise<Portfolio[]>;

  // Alerts
  getAlerts(): Promise<Alert[]>;
  saveAlerts(alerts: Alert[]): Promise<void>;

  // Archetypes
  getCustomArchetypes(): Promise<Archetype[]>;
  saveCustomArchetypes(archetypes: Archetype[]): Promise<void>;

  // Custom Reference Models (BYOA)
  getCustomReferenceModels(): Promise<ReferenceModel[]>;
  saveCustomReferenceModels(models: ReferenceModel[]): Promise<void>;

  // Snapshots
  getSnapshots(buildId: string): Promise<SnapshotResponse[]>;
}
