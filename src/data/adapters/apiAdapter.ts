import type { Build, Decision, Comment, ActivityLog, Portfolio, Alert, ReferenceModel } from '../../types';
import type { AuthUser } from '../../utils/auth';
import type { StorageAdapter, SnapshotResponse } from './storageAdapter';

const API_BASE = '/api';

type ApiDecision = Omit<Decision, 'approver' | 'timestamp'> & {
  approverName: string;
  createdAt: string;
};

type ApiComment = Omit<Comment, 'author' | 'role' | 'timestamp'> & {
  authorName: string;
  authorRole: string;
  createdAt: string;
};

async function headers(user?: AuthUser): Promise<Record<string, string>> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user && user.id !== 'demo-user' && user.getToken) {
    const token = await user.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

function toDecision(decision: ApiDecision): Decision {
  const { approverName, createdAt, ...decisionFields } = decision;
  return {
    ...decisionFields,
    approver: approverName,
    timestamp: createdAt,
  };
}

function toComment(comment: ApiComment): Comment {
  const { authorName, authorRole, createdAt, ...commentFields } = comment;
  return {
    ...commentFields,
    author: authorName,
    role: authorRole,
    timestamp: createdAt,
  };
}

export function createApiAdapter(user?: AuthUser): StorageAdapter {
  const _uid = () => user?.id || 'demo-user';
  const uname = () => user?.name || 'Demo User';
  const upersona = () => user?.persona || 'executive';

  return {
    name: 'api',

    async getBuilds() {
      const res = await fetch(`${API_BASE}/builds?includeFrozen=true`, { headers: headers(user) });
      return handleResponse<Build[]>(res);
    },
    async getBuild(id: string) {
      const res = await fetch(`${API_BASE}/builds?id=${id}`, { headers: headers(user) });
      return handleResponse<Build | null>(res);
    },
    async createBuild(build: Partial<Build>) {
      const res = await fetch(`${API_BASE}/builds`, {
        method: 'POST',
        headers: headers(user),
        body: JSON.stringify({ ...build, creatorName: uname() }),
      });
      return handleResponse<Build>(res);
    },
    async updateBuild(id: string, changes: Partial<Build>) {
      const res = await fetch(`${API_BASE}/builds?id=${id}`, {
        method: 'PATCH',
        headers: headers(user),
        body: JSON.stringify(changes),
      });
      return handleResponse<Build>(res);
    },
    async deleteBuild(id: string) {
      const res = await fetch(`${API_BASE}/builds?id=${id}`, { method: 'DELETE', headers: headers(user) });
      await handleResponse<Record<string, never>>(res);
    },

    async transitionStatus(buildId: string) {
      const res = await fetch(`${API_BASE}/status-transition`, {
        method: 'POST',
        headers: headers(user),
        body: JSON.stringify({ buildId }),
      });
      return handleResponse<Build>(res);
    },

    async newVersion(sourceBuildId: string, newName?: string, changes?: Partial<Build>) {
      const res = await fetch(`${API_BASE}/new-version`, {
        method: 'POST',
        headers: headers(user),
        body: JSON.stringify({ sourceBuildId, newName, changes }),
      });
      return handleResponse<Build>(res);
    },

    async getDecisions() {
      const res = await fetch(`${API_BASE}/decisions`, { headers: headers(user) });
      const decisions = await handleResponse<ApiDecision[]>(res);
      return decisions.map(toDecision);
    },
    async recordDecision(decision: Omit<Decision, 'id' | 'timestamp'>) {
      const res = await fetch(`${API_BASE}/decisions`, {
        method: 'POST',
        headers: headers(user),
        body: JSON.stringify({ ...decision, approverName: uname() }),
      });
      return toDecision(await handleResponse<ApiDecision>(res));
    },

    async getComments(buildId: string) {
      const res = await fetch(`${API_BASE}/comments?buildId=${buildId}`, { headers: headers(user) });
      const comments = await handleResponse<ApiComment[]>(res);
      return comments.map(toComment);
    },
    async addComment(buildId: string, elementId: string | null, content: string, _authorName: string, _authorRole: string, versionStamp?: string) {
      const res = await fetch(`${API_BASE}/comments`, {
        method: 'POST',
        headers: headers(user),
        body: JSON.stringify({ buildId, elementId, content, authorName: uname(), authorRole: upersona(), versionStamp }),
      });
      return toComment(await handleResponse<ApiComment>(res));
    },

    async getActivities() { return []; },
    async addActivity(_activity: ActivityLog) {},
    async setActivities(_activities: ActivityLog[]) {},

    async getPortfolios() {
      const res = await fetch(`${API_BASE}/portfolios`, { headers: headers(user) });
      return handleResponse<Portfolio[]>(res);
    },
    async savePortfolios(portfolios: Portfolio[]) {
      const res = await fetch(`${API_BASE}/portfolios`, {
        method: 'PUT',
        headers: headers(user),
        body: JSON.stringify({ portfolios }),
      });
      return handleResponse<Portfolio[]>(res);
    },

    async getAlerts() { return []; },
    async saveAlerts(_alerts: Alert[]) {},

    async getCustomArchetypes() { return []; },
    async saveCustomArchetypes(_archetypes: any[]) {},

    async getCustomReferenceModels() { return []; },
    async saveCustomReferenceModels(_models: ReferenceModel[]) {},

    async getSnapshots(buildId: string): Promise<SnapshotResponse[]> {
      const res = await fetch(`${API_BASE}/snapshots?buildId=${buildId}`, { headers: headers(user) });
      return handleResponse<SnapshotResponse[]>(res);
    },
  };
}
