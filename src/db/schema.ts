import { pgTable, serial, text, integer, timestamp, boolean, doublePrecision, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (League participants)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  teamName: text('team_name'),
  teamAbbr: text('team_abbr'),
  logoUrl: text('logo_url'),
  role: text('role').default('user').notNull(), // 'user' or 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Golfers table
export const golfers = pgTable('golfers', {
  id: integer('id').primaryKey(), // Using ESPN Athlete ID if available, or rank as id
  name: text('name').notNull(),
  rank: integer('rank').notNull(),
  country: text('country'),
  type: text('type').notNull(), // 'top20', 'field', 'liv'
  espnId: text('espn_id'),
  starts: integer('starts').default(0).notNull(),
  cutsMade: integer('cuts_made').default(0).notNull(),
  avgPoints: doublePrecision('avg_points').default(0).notNull(),
  historicalResults: jsonb('historical_results').default([]),
});

// Tournaments table (24 events)
export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey(), // ESPN event ID or custom slug
  name: text('name').notNull(),
  type: text('type').notNull(), // 'regular' or 'major'
  startDate: timestamp('start_date').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'active', 'completed'
});

// Draft States (Active draft tracking)
export const draftStates = pgTable('draft_states', {
  id: serial('id').primaryKey(),
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }), // null for preseason long draft
  type: text('type').notNull(), // 'long' or 'short'
  status: text('status').default('pending').notNull(), // 'pending', 'active', 'completed'
  currentRound: integer('current_round').default(1).notNull(),
  currentPick: integer('current_pick').default(1).notNull(),
  pickOrder: text('pick_order').notNull(), // JSON string representing array of user IDs: "[1, 3, 2...]"
  startTime: timestamp('start_time'), // Optional scheduled start time
  lastActionAt: timestamp('last_action_at'), // Base time for the 60-second timer
  autoDraftUsers: text('auto_draft_users').default('[]').notNull(), // JSON string representing array of user IDs on auto-draft
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Draft Picks (Pick-by-pick logs)
export const draftPicks = pgTable('draft_picks', {
  id: serial('id').primaryKey(),
  draftId: integer('draft_id').references(() => draftStates.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  golferId: integer('golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  round: integer('round').notNull(),
  pickNumber: integer('pick_number').notNull(), // Overall pick number
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Rosters (Roster members)
export const rosters = pgTable('rosters', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  golferId: integer('golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  acquiredVia: text('acquired_via').notNull(), // 'long_draft', 'short_draft', 'free_agency'
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }), // Set for short draft players (expires), null for long draft players (permanent)
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Lineups (starters vs bench for each tournament)
export const lineups = pgTable('lineups', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  golferId: integer('golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  isActive: boolean('is_active').default(false).notNull(), // true = active starter (6 per week), false = bench
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Major Selections (tier selections for the 4 majors)
export const majorSelections = pgTable('major_selections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  tier1GolferId: integer('tier1_golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  tier2GolferId: integer('tier2_golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  tier3GolferId: integer('tier3_golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  tier4GolferId: integer('tier4_golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Trades table
export const trades = pgTable('trades', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: integer('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'accepted', 'declined', 'countered'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Trade Items (Golfers involved in the trade)
export const tradeItems = pgTable('trade_items', {
  id: serial('id').primaryKey(),
  tradeId: integer('trade_id').references(() => trades.id, { onDelete: 'cascade' }).notNull(),
  golferId: integer('golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  direction: text('direction').notNull(), // 'send' (from sender to receiver) or 'receive' (from receiver to sender)
});

// Free Agency / Transaction logs
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  golferAddedId: integer('golfer_added_id').references(() => golfers.id, { onDelete: 'cascade' }),
  golferDroppedId: integer('golfer_dropped_id').references(() => golfers.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'free_agency' or 'trade'
  transactionDate: timestamp('transaction_date').defaultNow().notNull(),
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }),
});

// Fantasy Scores (Points calculated per player per tournament)
export const scores = pgTable('scores', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tournamentId: text('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  golferId: integer('golfer_id').references(() => golfers.id, { onDelete: 'cascade' }).notNull(),
  madeCut: boolean('made_cut').default(true).notNull(),
  holePoints: doublePrecision('hole_points').default(0).notNull(),
  placingPoints: doublePrecision('placing_points').default(0).notNull(),
  totalPoints: doublePrecision('total_points').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations definitions (Drizzle ORM relations)
export const usersRelations = relations(users, ({ many }) => ({
  draftPicks: many(draftPicks),
  rosterMembers: many(rosters),
  lineups: many(lineups),
  scores: many(scores),
  sentTrades: many(trades, { relationName: 'sentTrades' }),
  receivedTrades: many(trades, { relationName: 'receivedTrades' }),
}));

export const golfersRelations = relations(golfers, ({ many }) => ({
  draftPicks: many(draftPicks),
  rosters: many(rosters),
  lineups: many(lineups),
  scores: many(scores),
}));

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  drafts: many(draftStates),
  lineups: many(lineups),
  scores: many(scores),
}));

export const draftStatesRelations = relations(draftStates, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [draftStates.tournamentId],
    references: [tournaments.id],
  }),
  picks: many(draftPicks),
}));

export const draftPicksRelations = relations(draftPicks, ({ one }) => ({
  draft: one(draftStates, {
    fields: [draftPicks.draftId],
    references: [draftStates.id],
  }),
  user: one(users, {
    fields: [draftPicks.userId],
    references: [users.id],
  }),
  golfer: one(golfers, {
    fields: [draftPicks.golferId],
    references: [golfers.id],
  }),
}));

export const rostersRelations = relations(rosters, ({ one }) => ({
  user: one(users, {
    fields: [rosters.userId],
    references: [users.id],
  }),
  golfer: one(golfers, {
    fields: [rosters.golferId],
    references: [golfers.id],
  }),
  tournament: one(tournaments, {
    fields: [rosters.tournamentId],
    references: [tournaments.id],
  }),
}));

export const lineupsRelations = relations(lineups, ({ one }) => ({
  user: one(users, {
    fields: [lineups.userId],
    references: [users.id],
  }),
  tournament: one(tournaments, {
    fields: [lineups.tournamentId],
    references: [tournaments.id],
  }),
  golfer: one(golfers, {
    fields: [lineups.golferId],
    references: [golfers.id],
  }),
}));

export const majorSelectionsRelations = relations(majorSelections, ({ one }) => ({
  user: one(users, { fields: [majorSelections.userId], references: [users.id] }),
  tournament: one(tournaments, { fields: [majorSelections.tournamentId], references: [tournaments.id] }),
  tier1Golfer: one(golfers, { fields: [majorSelections.tier1GolferId], references: [golfers.id] }),
  tier2Golfer: one(golfers, { fields: [majorSelections.tier2GolferId], references: [golfers.id] }),
  tier3Golfer: one(golfers, { fields: [majorSelections.tier3GolferId], references: [golfers.id] }),
  tier4Golfer: one(golfers, { fields: [majorSelections.tier4GolferId], references: [golfers.id] }),
}));

export const tradesRelations = relations(trades, ({ one, many }) => ({
  sender: one(users, {
    fields: [trades.senderId],
    references: [users.id],
    relationName: 'sentTrades',
  }),
  receiver: one(users, {
    fields: [trades.receiverId],
    references: [users.id],
    relationName: 'receivedTrades',
  }),
  items: many(tradeItems),
}));

export const tradeItemsRelations = relations(tradeItems, ({ one }) => ({
  trade: one(trades, {
    fields: [tradeItems.tradeId],
    references: [trades.id],
  }),
  golfer: one(golfers, {
    fields: [tradeItems.golferId],
    references: [golfers.id],
  }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
  user: one(users, {
    fields: [scores.userId],
    references: [users.id],
  }),
  tournament: one(tournaments, {
    fields: [scores.tournamentId],
    references: [tournaments.id],
  }),
  golfer: one(golfers, {
    fields: [scores.golferId],
    references: [golfers.id],
  }),
}));
