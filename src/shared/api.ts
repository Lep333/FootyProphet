export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};

export type GuessPost = {
  type: 'guess_post';
  scoreHomeTeam: number;
  scoreAwayTeam: number;
}

export type GuessResponse = {
  type: 'guess';
  postId: string;
  scoreHomeTeam: number;
  scoreAwayTeam: number;
  userPredicted: boolean;
}