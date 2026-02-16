import { ponder } from "ponder:registry";
import { game, prophet, acolyte, gameEvent } from "ponder:schema";

const GAME_STATUS = {
  open: "open",
  started: "started",
  oracle: "oracle",
  ended: "ended",
} as const;

// ---- Phenomenon: game lifecycle ----

ponder.on("Phenomenon:ProphetEnteredGame", async ({ event, context }) => {
  const { gameNumber, prophetNumber, sender } = event.args;
  const gameId = String(gameNumber);

  await context.db
    .insert(game)
    .values({
      id: gameId,
      gameNumber,
      status: GAME_STATUS.open,
      currentProphetTurn: 0,
      prophetsRemaining: 0, // updated below
      totalTickets: 0n,
      tokenBalance: 0n,
      startBlock: event.block.number,
    })
    .onConflictDoNothing();

  const existingProphets = await context.db.sql.query.prophet.findMany({
    where: (t, { eq }) => eq(t.gameId, gameId),
  });
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

  const count = existingProphets.length + 1;
  await context.db.update(game, { id: gameId }).set({ prophetsRemaining: count });

  await context.db.insert(gameEvent).values({
    id: `${event.log.id}`,
    gameId,
    type: "prophetEnteredGame",
    prophetIndex,
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("Phenomenon:GameStarted", async ({ event, context }) => {
  const gameNumber = event.args.gameNumber;
  const gameId = String(gameNumber);

  await context.db.update(game, { id: gameId }).set({
    status: GAME_STATUS.started,
    currentProphetTurn: 0,
  });

  await context.db.insert(gameEvent).values({
    id: `GameStarted-${event.block.hash}-${event.log.logIndex}`,
    gameId,
    type: "gameStarted",
    prophetIndex: null,
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("Phenomenon:CurrentTurn", async ({ event, context }) => {
  const nextProphetTurn = event.args.nextProphetTurn;
  const games = await context.db.sql.query.game.findMany({
    where: (t, { eq }) => eq(t.status, GAME_STATUS.started),
  });
  for (const g of games) {
    await context.db.update(game, { id: g.id }).set({ currentProphetTurn: Number(nextProphetTurn) });
  }
});

ponder.on("Phenomenon:GameEnded", async ({ event, context }) => {
  const { gameNumber, currentProphetTurn } = event.args;
  const gameId = String(gameNumber);

  await context.db.update(game, { id: gameId }).set({
    status: GAME_STATUS.ended,
    endBlock: event.block.number,
    winnerProphetIndex: Number(currentProphetTurn),
  });

  await context.db.insert(gameEvent).values({
    id: `GameEnded-${event.block.hash}-${event.log.logIndex}`,
    gameId,
    type: "gameEnded",
    prophetIndex: Number(currentProphetTurn),
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("Phenomenon:GameReset", async ({ event, context }) => {
  const newGameNumber = event.args.newGameNumber;
  const gameId = String(newGameNumber);

  await context.db
    .insert(game)
    .values({
      id: gameId,
      gameNumber: newGameNumber,
      status: GAME_STATUS.open,
      currentProphetTurn: 0,
      prophetsRemaining: 0,
      totalTickets: 0n,
      tokenBalance: 0n,
      startBlock: event.block.number,
      endBlock: null,
      winnerProphetIndex: null,
    })
    .onConflictDoUpdate((row) => ({
      status: GAME_STATUS.open,
      prophetsRemaining: 0,
      startBlock: event.block.number,
    }));

  await context.db.insert(gameEvent).values({
    id: `GameReset-${event.block.hash}-${event.log.logIndex}`,
    gameId,
    type: "gameReset",
    prophetIndex: null,
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

// ---- GameplayEngine: miracle, smite, accusation ----

ponder.on("GameplayEngine:MiracleAttempted", async ({ event, context }) => {
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
    await context.db.insert(gameEvent).values({
      id: `MiracleAttempted-${event.block.hash}-${event.log.logIndex}`,
      gameId: g.id,
      type: "miracleAttempted",
      prophetIndex: Number(currentProphetTurn),
      targetIndex: null,
      success: isSuccess,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    });
  }
});

ponder.on("GameplayEngine:SmiteAttempted", async ({ event, context }) => {
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
    await context.db.insert(gameEvent).values({
      id: `SmiteAttempted-${event.block.hash}-${event.log.logIndex}`,
      gameId: g.id,
      type: "smiteAttempted",
      prophetIndex: Number(currentProphetTurn),
      targetIndex: Number(target),
      success: isSuccess,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    });
  }
});

ponder.on("GameplayEngine:Accusation", async ({ event, context }) => {
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
    await context.db.insert(gameEvent).values({
      id: `Accusation-${event.block.hash}-${event.log.logIndex}`,
      gameId: g.id,
      type: "accusation",
      prophetIndex: Number(currentProphetTurn),
      targetIndex: targetIdx,
      success: isSuccess,
      blockNumber: event.block.number,
      transactionHash: event.transaction.hash,
    });
  }
});

// ---- TicketEngine: tickets ----

ponder.on("TicketEngine:GainReligion", async ({ event, context }) => {
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

  await context.db.insert(gameEvent).values({
    id: `GainReligion-${event.block.hash}-${event.log.logIndex}`,
    gameId,
    type: "gainReligion",
    prophetIndex: Number(_target),
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("TicketEngine:ReligionLost", async ({ event, context }) => {
  const { _target, numTicketsSold, sender } = event.args;
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

  await context.db.insert(gameEvent).values({
    id: `ReligionLost-${event.block.hash}-${event.log.logIndex}`,
    gameId,
    type: "religionLost",
    prophetIndex: Number(_target),
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});

ponder.on("TicketEngine:TicketsClaimed", async ({ event, context }) => {
  const { gameNumber } = event.args;
  const gameId = String(gameNumber);
  await context.db.insert(gameEvent).values({
    id: `TicketsClaimed-${event.block.hash}-${event.log.logIndex}`,
    gameId,
    type: "ticketsClaimed",
    prophetIndex: null,
    targetIndex: null,
    success: true,
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});
