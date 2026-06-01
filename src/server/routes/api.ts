import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  GuessPost,
  GuessResponse,
  IncrementResponse,
  InitResponse,
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