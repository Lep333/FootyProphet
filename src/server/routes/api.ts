import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  GuessPost,
  GuessResponse,
  IncrementResponse,
  InitResponse,
  MatchPut,
  MatchResponse,
  Participant,
  ParticipantList,
} from '../../shared/api';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});

api.get('/match', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  const response = await redis.hGetAll(postId);
  const matches: MatchResponse[] = Object.keys(response)
    .filter((key) => key.startsWith("match:"))
    .map((key) => JSON.parse(response[key]))
  return c.json<MatchResponse[]>(matches);
})

api.post('/match', async (c) => {
  const body: MatchPost = await c.req.json<{ match: MatchPost }>();
  const uuid = crypto.randomUUID();
  const newMatch: MatchResponse = {
    ...body.match,
    id: uuid,
  }

  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  await redis.hSet(postId, {[`match:${uuid}`]: JSON.stringify(newMatch)});
  return c.json<MatchResponse>(newMatch);
})

api.put('/match', async (c) => {
  const body: MatchPut = await c.req.json<{ match: MatchPut }>();
  
  // Extract values out of the nested guess wrapper
  const { postId, userId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  await redis.hSet(postId, {[postId!]: `${body.tournamentName};${body.tournamentPhase};${body.scoreHome};${body.scoreAway};${body.teamHomeName};${body.teamAwayName};${body.flagHome};${body.flagAway};${body.startDate}`});
  return c.json<MatchPut>(body);
})

api.get('/guess', async (c) => {
  const { postId, userId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  const userIdString = userId!;
  const guess = await redis.hGet(postId, userIdString);
  console.log(guess);
  let userPredicted = true;
  if (!guess) {
    userPredicted = false;
  }
  const [scoreHomeTeam, scoreAwayTeam] = (guess ?? '0;0').split(';')
  const scoreHomeTeamNumber = Number(scoreHomeTeam);
  const scoreAwayTeamNumber = Number(scoreAwayTeam); 
  return c.json<GuessResponse>({
    postId,
    scoreHomeTeam: scoreHomeTeamNumber,
    scoreAwayTeam: scoreAwayTeamNumber,
    userPredicted,
    type: 'guess',
  });
})


api.post('/guess', async (c) => {
  const body = await c.req.json<{ guess: GuessPost }>();
  
  // Extract values out of the nested guess wrapper
  const { scoreHomeTeam, scoreAwayTeam } = body.guess;
  const { postId, userId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  await redis.hSet(postId, {[userId!]: `${scoreHomeTeam};${scoreAwayTeam}`});
  return c.json<GuessResponse>({
    postId,
    scoreHomeTeam: scoreHomeTeam,
    scoreAwayTeam: scoreAwayTeam,
    userPredicted: true,
    type: 'guess',
  });
})

api.get('/participant', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  let participants = (await redis.hGet(postId, "teams"))?.split(";");
  if (!participants) {
    return
  }
  const teams = Array<Participant>();
  for (let participant of participants) {
    const [name, flag] = participant.split("_");
    const parti: Participant = {
      type: "participant",
      name: name ?? "Unknown Team",
      flag_emoji: flag ?? "🌍",
    }
    teams.push(parti);
  }
  
  return c.json<ParticipantList>({
    participants: teams,
  })
})

api.post('/participant', async (c) => {
  const body = await c.req.json<{ participant: Participant }>();

  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }
  let participants = (await redis.hGet(postId, "teams"));
  if (participants) {
    participants = `${participants};${body.participant.name}_${body.participant.flag_emoji}`
  } else {
    participants = `${body.participant.name}_${body.participant.flag_emoji}`
  }
  await redis.hSet(postId, {"teams": participants});
  return c.json<Participant>({
    type: "participant",
    name: body.participant.name,
    flag_emoji: body.participant.flag_emoji,
  })
})