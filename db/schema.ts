import { pgTable, text, integer, boolean, timestamp, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  persona: text('persona', { enum: ['architect', 'manufacturing', 'finance', 'program', 'executive'] }).notNull().default('executive'),
  onboardingStep: integer('onboarding_step').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const builds = pgTable('builds', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  creatorId: text('creator_id').notNull().references(() => users.id),
  creatorName: text('creator_name').notNull(),
  organization: text('organization').notNull().default(''),
  parentId: uuid('parent_id'),
  status: text('status', { enum: ['Draft', 'TechnicalReview', 'FinancialReview', 'ProgramReview', 'Approved', 'Alert'] }).notNull().default('Draft'),
  version: text('version').notNull().default('v1.0'),
  owner: text('owner').notNull().default(''),
  portfolio: text('portfolio').notNull().default(''),
  referenceModel: text('reference_model').notNull().default(''),
  formulaVersion: text('formula_version').notNull().default('Murphy-SIA-v4.2'),
  designModel: jsonb('design_model').notNull(),
  architecture: jsonb('architecture'),
  dataVintage: jsonb('data_vintage'),
  frozenAt: timestamp('frozen_at'),
  contentHash: text('content_hash'),
  createdDate: timestamp('created_date').notNull().defaultNow(),
  updatedDate: timestamp('updated_date').notNull().defaultNow(),
});

export const buildEvents = pgTable('build_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildId: uuid('build_id').notNull().references(() => builds.id),
  actorId: text('actor_id').notNull().references(() => users.id),
  eventType: text('event_type', { enum: ['created', 'updated', 'frozen', 'status_transition', 'new_version', 'commented', 'decision_recorded'] }).notNull(),
  payload: jsonb('payload'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const snapshots = pgTable('snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildId: uuid('build_id').notNull().references(() => builds.id),
  snapshot: jsonb('snapshot').notNull(),
  contentHash: text('content_hash').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildIds: jsonb('build_ids').notNull(),
  outcome: text('outcome', { enum: ['Proceed', 'Proceed with Risk', 'Requires Investigation', 'Hold', 'Reject'] }).notNull(),
  approverId: text('approver_id').notNull().references(() => users.id),
  approverName: text('approver_name').notNull(),
  rationale: text('rationale').notNull(),
  followUpActions: jsonb('follow_up_actions').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildId: uuid('build_id').notNull().references(() => builds.id),
  elementId: text('element_id'),
  authorId: text('author_id').notNull().references(() => users.id),
  authorName: text('author_name').notNull(),
  authorRole: text('author_role').notNull(),
  content: text('content').notNull(),
  versionStamp: text('version_stamp'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const portfolios = pgTable('portfolios', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  ownerId: text('owner_id').notNull().references(() => users.id),
  buildIds: jsonb('build_ids').notNull().default([]),
  tags: jsonb('tags').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const alertAcks = pgTable('alert_acks', {
  id: uuid('id').primaryKey().defaultRandom(),
  buildId: uuid('build_id').notNull().references(() => builds.id),
  ruleId: text('rule_id').notNull(),
  acknowledged: boolean('acknowledged').notNull().default(true),
  acknowledgedById: text('acknowledged_by_id').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const customArchetypes = pgTable('custom_archetypes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: text('owner_id').notNull().references(() => users.id),
  archetype: jsonb('archetype').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
