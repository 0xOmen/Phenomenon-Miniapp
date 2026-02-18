import { onchainTable, index, relations } from "ponder";

// Global config from Phenomenon (e.g. numberOfProphetsSet)
export const config = onchainTable(
  "config",
  (t) => ({
    id: t.text().primaryKey(), // "0" = single row
    numberOfProphets: t.integer().notNull(),
  }),
  () => ({}),
);

// Game state per game number
export const game = onchainTable(
  "game",
  (t) => ({
    id: t.text().primaryKey(), // gameNumber as string
    gameNumber: t.bigint().notNull(),
    status: t.text().notNull(), // "open" | "started" | "oracle" | "ended"
    currentProphetTurn: t.integer().notNull(), // prophet index
    prophetsRemaining: t.integer().notNull(),
    prophetsRequired: t.integer(), // from numberOfProphetsSet when game created
    totalTickets: t.bigint().notNull(),
    tokenBalance: t.bigint().notNull(),
    startBlock: t.bigint(),
    endBlock: t.bigint(),
    winnerProphetIndex: t.integer(), // set when ended
    endTotalTickets: t.bigint(), // snapshot at game end for prior-game stats
    winningTicketsAtEnd: t.bigint(), // tickets for winner at game end (for prior-game %)
  }),
  (table) => ({
    gameNumberIdx: index().on(table.gameNumber),
  })
);

// Prophet per game (one row per prophet index per game)
export const prophet = onchainTable(
  "prophet",
  (t) => ({
    id: t.text().primaryKey(), // `${gameId}-${prophetIndex}`
    gameId: t.text().notNull(),
    prophetIndex: t.integer().notNull(),
    playerAddress: t.hex().notNull(),
    isAlive: t.boolean().notNull(),
    isFree: t.boolean().notNull(),
    role: t.text().notNull(), // "prophet" | "highPriest"
    accolites: t.bigint().notNull(),
    highPriests: t.bigint().notNull(),
    tokensPerTicket: t.bigint(),
  }),
  (table) => ({
    gameIdIdx: index().on(table.gameId),
    playerAddressIdx: index().on(table.playerAddress),
  })
);

// Acolyte / ticket holdings per game and owner
export const acolyte = onchainTable(
  "acolyte",
  (t) => ({
    id: t.text().primaryKey(), // `${gameId}-${ownerAddress}`
    gameId: t.text().notNull(),
    ownerAddress: t.hex().notNull(),
    prophetIndex: t.integer().notNull(),
    ticketCount: t.bigint().notNull(),
  }),
  (table) => ({
    gameIdIdx: index().on(table.gameId),
    ownerAddressIdx: index().on(table.ownerAddress),
  })
);

// Ticket claims (when winner claims winnings)
export const ticketClaim = onchainTable(
  "ticket_claim",
  (t) => ({
    id: t.text().primaryKey(), // `${gameId}-${ownerAddress}`
    gameId: t.text().notNull(),
    ownerAddress: t.hex().notNull(),
    tokensClaimed: t.bigint().notNull(),
  }),
  (table) => ({
    gameIdIdx: index().on(table.gameId),
    ownerAddressIdx: index().on(table.ownerAddress),
  })
);

// Game events for "last action" and history
export const gameEvent = onchainTable(
  "game_event",
  (t) => ({
    id: t.text().primaryKey(), // `${block.hash}-${log.logIndex}`
    gameId: t.text().notNull(),
    type: t.text().notNull(),
    prophetIndex: t.integer(),
    targetIndex: t.integer(),
    success: t.boolean(),
    targetIsAlive: t.boolean(), // for accusation: true = target sent to jail, false = eliminated
    actorAddress: t.hex(), // e.g. sender for gainReligion (who bought tickets)
    blockNumber: t.bigint().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    gameIdIdx: index().on(table.gameId),
    blockNumberIdx: index().on(table.blockNumber),
  })
);

export const gameRelations = relations(game, ({ many }) => ({
  prophets: many(prophet),
  acolytes: many(acolyte),
  events: many(gameEvent),
  ticketClaims: many(ticketClaim),
}));

export const ticketClaimRelations = relations(ticketClaim, ({ one }) => ({
  game: one(game, { fields: [ticketClaim.gameId], references: [game.id] }),
}));

export const prophetRelations = relations(prophet, ({ one }) => ({
  game: one(game, { fields: [prophet.gameId], references: [game.id] }),
}));

export const acolyteRelations = relations(acolyte, ({ one }) => ({
  game: one(game, { fields: [acolyte.gameId], references: [game.id] }),
}));

export const gameEventRelations = relations(gameEvent, ({ one }) => ({
  game: one(game, { fields: [gameEvent.gameId], references: [game.id] }),
}));
