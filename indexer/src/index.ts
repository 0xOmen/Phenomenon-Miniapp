import { ponder } from "ponder:registry";
import { game, prophet, acolyte, gameEvent, config } from "ponder:schema";

const GAME_STATUS = {
  open: "open",
  started: "started",
  oracle: "oracle",
  ended: "ended",
} as const;

// ---- GameplayEngine: prophet entry + game started ----

ponder.on("GameplayEngine:prophetEnteredGame", async ({ event, context }) => {
  const { prophetNumber, sender, gameNumber } = event.args;
  const gameId = String(gameNumber);

  const configRow = await context.db.find(config, { id: "0" });
  const prophetsRequired = configRow ? configRow.numberOfProphets : 2;

  await context.db
    .insert(game)
    .values({
      id: gameId,
      gameNumber,
      status: GAME_STATUS.open,
      currentProphetTurn: 0,
      prophetsRemaining: 0, // updated below
      prophetsRequired,
      totalTickets: 0n,
      tokenBalance: 0n,
      startBlock: event.block.number,
    })
    .onConflictDoNothing();

  const prophetIndex = Number(prophetNumber);
  const prophetId = `${gameId}-${prophetIndex}`;

  await context.db
    .insert(prophet)
    .values({
      id: prophetId,
      gameId,
      prophetIndex,
      playerAddress: sender,
      isAlive: true,
      isFree: true,
      role: "prophet",
      accolites: 0n,
      highPriests: 0n,
      tokensPerTicket: null,
    })
    .onConflictDoUpdate((row) => ({
      playerAddress: sender,
      isAlive: true,
      isFree: true,
      role: "prophet",
    }));

  const prophetsForGame = await context.db.sql.query.prophet.findMany({
    where: (t, { eq }) => eq(t.gameId, gameId),
  });
  await context.db.update(game, { id: gameId }).set({ prophetsRemaining: prophetsForGame.length });

  await context.db
    .insert(gameEvent)
    .values({
      id: `prophetEnteredGame-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "prophetEnteredGame",
      prophetIndex,
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

// Phenomenon also emits prophetRegistered in the same tx; record it as a game event (prophet already upserted above).
ponder.on("Phenomenon:prophetRegistered", async ({ event, context }) => {
  const { gameNumber, prophet: prophetAddress, prophetNum } = event.args;
  const gameId = String(gameNumber);
  const prophetIndex = Number(prophetNum);

  await context.db
    .insert(gameEvent)
    .values({
      id: `prophetRegistered-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "prophetRegistered",
      prophetIndex,
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

ponder.on("GameplayEngine:gameStarted", async ({ event, context }) => {
  const gameNumber = event.args.gameNumber;
  const gameId = String(gameNumber);

  await context.db.update(game, { id: gameId }).set({
    status: GAME_STATUS.started,
    currentProphetTurn: 0,
  });

  await context.db
    .insert(gameEvent)
    .values({
      id: `gameStarted-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "gameStarted",
      prophetIndex: null,
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

// ---- Phenomenon: turn, ended, reset ----

ponder.on("Phenomenon:currentTurn", async ({ event, context }) => {
  const nextProphetTurn = event.args.nextProphetTurn;
  const games = await context.db.sql.query.game.findMany({
    where: (t, { eq }) => eq(t.status, GAME_STATUS.started),
  });
  for (const g of games) {
    await context.db.update(game, { id: g.id }).set({ currentProphetTurn: Number(nextProphetTurn) });
  }
});

ponder.on("Phenomenon:gameEnded", async ({ event, context }) => {
  const { gameNumber, currentProphetTurn } = event.args;
  const gameId = String(gameNumber);

  await context.db.update(game, { id: gameId }).set({
    status: GAME_STATUS.ended,
    endBlock: event.block.number,
    winnerProphetIndex: Number(currentProphetTurn),
  });

  await context.db
    .insert(gameEvent)
    .values({
      id: `gameEnded-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "gameEnded",
      prophetIndex: Number(currentProphetTurn),
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

ponder.on("Phenomenon:numberOfProphetsSet", async ({ event, context }) => {
  const numberOfProphets = Number(event.args.numberOfProphets);
  await context.db
    .insert(config)
    .values({ id: "0", numberOfProphets })
    .onConflictDoUpdate((row) => ({ numberOfProphets }));
  // Backfill existing games that have null prophetsRequired (e.g. game 0 created by prophetEnteredGame)
  const allGames = await context.db.sql.query.game.findMany();
  for (const g of allGames) {
    if (g.prophetsRequired == null) {
      await context.db.update(game, { id: g.id }).set({ prophetsRequired: numberOfProphets });
    }
  }
});

ponder.on("Phenomenon:gameReset", async ({ event, context }) => {
  const newGameNumber = event.args.newGameNumber;
  const gameId = String(newGameNumber);

  const configRow = await context.db.find(config, { id: "0" });
  const prophetsRequired = configRow ? configRow.numberOfProphets : 2;

  await context.db
    .insert(game)
    .values({
      id: gameId,
      gameNumber: newGameNumber,
      status: GAME_STATUS.open,
      currentProphetTurn: 0,
      prophetsRemaining: 0,
      prophetsRequired,
      totalTickets: 0n,
      tokenBalance: 0n,
      startBlock: event.block.number,
      endBlock: null,
      winnerProphetIndex: null,
    })
    .onConflictDoUpdate((row) => ({
      status: GAME_STATUS.open,
      prophetsRemaining: 0,
      prophetsRequired,
      startBlock: event.block.number,
    }));

  await context.db
    .insert(gameEvent)
    .values({
      id: `gameReset-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "gameReset",
      prophetIndex: null,
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

// ---- GameplayEngine: miracle, smite, accusation ----

ponder.on("GameplayEngine:miracleAttempted", async ({ event, context }) => {
  const { isSuccess, currentProphetTurn } = event.args;
  const games = await context.db.sql.query.game.findMany({
    where: (t, { eq }) => eq(t.status, GAME_STATUS.started),
  });
  for (const g of games) {
    const prophetId = `${g.id}-${Number(currentProphetTurn)}`;
    const existing = await context.db.find(prophet, { id: prophetId });
    if (existing) {
      await context.db.update(prophet, { id: prophetId }).set({
        isAlive: isSuccess ? existing.isAlive : false,
      });
    }
    await context.db
      .insert(gameEvent)
      .values({
        id: `miracleAttempted-${event.block.hash}-${event.log.logIndex}`,
        gameId: g.id,
        type: "miracleAttempted",
        prophetIndex: Number(currentProphetTurn),
        targetIndex: null,
        success: isSuccess,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
      })
      .onConflictDoNothing();
  }
});

ponder.on("GameplayEngine:smiteAttempted", async ({ event, context }) => {
  const { target, isSuccess, currentProphetTurn } = event.args;
  const games = await context.db.sql.query.game.findMany({
    where: (t, { eq }) => eq(t.status, GAME_STATUS.started),
  });
  for (const g of games) {
    const targetProphetId = `${g.id}-${Number(target)}`;
    const existing = await context.db.find(prophet, { id: targetProphetId });
    if (existing && isSuccess) {
      await context.db.update(prophet, { id: targetProphetId }).set({ isAlive: false });
    }
    const turnProphetId = `${g.id}-${Number(currentProphetTurn)}`;
    const turnProphet = await context.db.find(prophet, { id: turnProphetId });
    if (turnProphet && !isSuccess) {
      await context.db.update(prophet, { id: turnProphetId }).set({ isFree: false });
    }
    await context.db
      .insert(gameEvent)
      .values({
        id: `smiteAttempted-${event.block.hash}-${event.log.logIndex}`,
        gameId: g.id,
        type: "smiteAttempted",
        prophetIndex: Number(currentProphetTurn),
        targetIndex: Number(target),
        success: isSuccess,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
      })
      .onConflictDoNothing();
  }
});

ponder.on("GameplayEngine:accusation", async ({ event, context }) => {
  const { isSuccess, targetIsAlive, currentProphetTurn, _target } = event.args;
  const games = await context.db.sql.query.game.findMany({
    where: (t, { eq }) => eq(t.status, GAME_STATUS.started),
  });
  for (const g of games) {
    const targetIdx = Number(_target);
    const targetProphetId = `${g.id}-${targetIdx}`;
    if (isSuccess) {
      const targetProphet = await context.db.find(prophet, { id: targetProphetId });
      if (targetProphet) {
        if (targetIsAlive) {
          await context.db.update(prophet, { id: targetProphetId }).set({ isFree: false });
        } else {
          await context.db.update(prophet, { id: targetProphetId }).set({ isAlive: false });
        }
      }
    } else {
      const turnProphetId = `${g.id}-${Number(currentProphetTurn)}`;
      await context.db.update(prophet, { id: turnProphetId }).set({ isFree: false });
    }
    await context.db
      .insert(gameEvent)
      .values({
        id: `accusation-${event.block.hash}-${event.log.logIndex}`,
        gameId: g.id,
        type: "accusation",
        prophetIndex: Number(currentProphetTurn),
        targetIndex: targetIdx,
        success: isSuccess,
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
      })
      .onConflictDoNothing();
  }
});

// ---- TicketEngine: tickets ----

ponder.on("TicketEngine:gainReligion", async ({ event, context }) => {
  const { _target, numTicketsBought, totalPrice, sender } = event.args;
  const games = await context.db.sql.query.game.findMany({
    orderBy: (t, { desc }) => desc(t.gameNumber),
    limit: 1,
  });
  const gameId = games[0]?.id ?? null;
  if (!gameId) return;

  const acolyteId = `${gameId}-${sender}`;
  const existing = await context.db.find(acolyte, { id: acolyteId });
  const newCount = existing ? existing.ticketCount + numTicketsBought : numTicketsBought;

  await context.db
    .insert(acolyte)
    .values({
      id: acolyteId,
      gameId,
      ownerAddress: sender,
      prophetIndex: Number(_target),
      ticketCount: newCount,
    })
    .onConflictDoUpdate((row) => ({
      prophetIndex: Number(_target),
      ticketCount: newCount,
    }));

  const prophetId = `${gameId}-${Number(_target)}`;
  const prop = await context.db.find(prophet, { id: prophetId });
  if (prop) {
    await context.db.update(prophet, { id: prophetId }).set({
      accolites: prop.accolites + numTicketsBought,
    });
  }

  await context.db
    .insert(gameEvent)
    .values({
      id: `gainReligion-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "gainReligion",
      prophetIndex: Number(_target),
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

ponder.on("TicketEngine:religionLost", async ({ event, context }) => {
  const { _target, numTicketsSold, totalPrice, sender } = event.args;
  const games = await context.db.sql.query.game.findMany({
    orderBy: (t, { desc }) => desc(t.gameNumber),
    limit: 1,
  });
  const gameId = games[0]?.id ?? null;
  if (!gameId) return;

  const acolyteId = `${gameId}-${sender}`;
  const existing = await context.db.find(acolyte, { id: acolyteId });
  const newCount = existing ? existing.ticketCount - numTicketsSold : 0n;
  if (newCount <= 0n) {
    await context.db.delete(acolyte, { id: acolyteId });
  } else {
    await context.db.update(acolyte, { id: acolyteId }).set({ ticketCount: newCount });
  }

  const prophetId = `${gameId}-${Number(_target)}`;
  const prop = await context.db.find(prophet, { id: prophetId });
  if (prop) {
    await context.db.update(prophet, { id: prophetId }).set({
      accolites: prop.accolites > numTicketsSold ? prop.accolites - numTicketsSold : 0n,
    });
  }

  await context.db
    .insert(gameEvent)
    .values({
      id: `religionLost-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "religionLost",
      prophetIndex: Number(_target),
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});

ponder.on("TicketEngine:ticketsClaimed", async ({ event, context }) => {
  const { player, tokensSent, gameNumber } = event.args;
  const gameId = String(gameNumber);
  await context.db
    .insert(gameEvent)
    .values({
      id: `ticketsClaimed-${event.block.hash}-${event.log.logIndex}`,
      gameId,
      type: "ticketsClaimed",
      prophetIndex: null,
      targetIndex: null,
      success: true,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    })
    .onConflictDoNothing();
});
