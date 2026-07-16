import { PersonaType } from '../types';

export interface PersonaConfig {
  icon: string;
  color: string;
  label: string;
  defaultTab: string;
  canEdit: boolean;
  metricOrder: string[];
}

export const PERSONA_CONFIG: Record<PersonaType, PersonaConfig> = {
  architect: {
    icon: 'Cpu',
    color: '#2563EB',
    label: 'Silicon Architect',
    defaultTab: 'build',
    canEdit: true,
    metricOrder: ['engineering', 'manufacturing', 'financial', 'program'],
  },
  manufacturing: {
    icon: 'Wrench',
    color: '#7C3AED',
    label: 'Foundry Engineer',
    defaultTab: 'build',
    canEdit: false,
    metricOrder: ['manufacturing', 'engineering', 'financial', 'program'],
  },
  finance: {
    icon: 'DollarSign',
    color: '#059669',
    label: 'Financial Analyst',
    defaultTab: 'build',
    canEdit: false,
    metricOrder: ['financial', 'manufacturing', 'engineering', 'program'],
  },
  program: {
    icon: 'Clock',
    color: '#D97706',
    label: 'Program Director',
    defaultTab: 'archbom',
    canEdit: false,
    metricOrder: ['program', 'engineering', 'manufacturing', 'financial'],
  },
  executive: {
    icon: 'Award',
    color: '#0D9488',
    label: 'Executive Board',
    defaultTab: 'dashboard',
    canEdit: false,
    metricOrder: ['financial', 'manufacturing', 'engineering', 'program'],
  },
};
