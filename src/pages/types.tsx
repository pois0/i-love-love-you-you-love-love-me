export type Optional<T> = T | null;

export type DrawMode = "COUNT" | "SCORE";

export type UserMap = Record<string, { user: UserInfo, lists: MediaEntryGroup[] }>

export type UserInfo = {
  name: string,
  id: number,
  statistics: {
    anime: UserStat,
  },
};

export type UserStat = {
  meanScore: number,
  standardDeviation: number,
};

export type MediaEntryGroup = {
  status?: Status,
  entries: {
    media: Media,
    score: number,
  }[],
};

export type Status = "CURRENT" | "PLANNING" | "COMPLETED" | "DROPPED" | "PAUSED" | "REPEATING";

export type Media = {
  id: number,
  title: {
    native: string,
  },
};

export type DataSet = {
  users: UserInfo[],
  animes: Anime[],
  statuses: AnimeStatus[],
};

export type Anime = {
  id: number,
  title: string,
  scores: Optional<number>[],
};

export type User = string;

export type AnimeStatus = {
  userId: number,
  animeId: number,
  status: Status,
  score: Optional<number>,
}
