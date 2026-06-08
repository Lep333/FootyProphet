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

export enum MatchStatus {
  upcomming = 1,
  ended,
}

export type MatchPost = {
  type: 'guess_put';
  teamHomeName: string;
  teamAwayName: string;
  startDate: Date;
  tournamentPhase: string;
  Status: MatchStatus;
}

export type MatchPut = {
  type: 'guess_put';
  scoreHome: number;
  scoreAway: number;
  teamHomeName: string;
  teamAwayName: string;
  flagHome: string;
  flagAway: string;
  startDate: Date;
  tournamentName: string;
  tournamentPhase: string;
  Status: MatchStatus;
}

export type MatchResponse = {
  type: 'match_response';
  id: string;
  scoreHome: number;
  scoreAway: number;
  teamHomeName: string;
  teamAwayName: string;
  flagHome: string;
  flagAway: string;
  startDate: Date;
  tournamentName: string;
  tournamentPhase: string;
  Status: MatchStatus;
}

export type Participant = {
  type: 'participant';
  name: string;
  flag_emoji: string;
}

export type ParticipantList = {
  participants: Participant[];
}