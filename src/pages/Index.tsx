import { ControlsContainer, FullScreenControl, SearchControl, SigmaContainer, ZoomControl } from "@react-sigma/core";
import clsx from "clsx";
import { GraphQLClient } from "graphql-request";
import React, { Suspense, useMemo, useState } from "react";
import useSWR from "swr";

import { useURLParams } from "~/hooks/useURLParams";
import { AnimeSearchControl } from "./AnimeSearchControl";

import { GraphDataController} from "./GraphDataController";
import { GraphEventsController } from "./GraphEventsController";
import { GraphSettingsController } from "./GraphSettingsController";
import { Anime, DataSet, DrawMode, UserMap, UserStat } from "./types";

const anilistClient = new GraphQLClient(
  "https://graphql.anilist.co",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  },
);

function makeQuery(userList: string[]): string {
  const queriedUsers = userList.map((name) =>
    `u${name}: MediaListCollection(userName: "${name}", type: ANIME){...mlc}`
  ).join("");
  return `
    fragment mlc on MediaListCollection {
      user {
        name
        id
        statistics {
          anime {
            meanScore
            standardDeviation
          }
        }
      }
      lists {
        status
        entries {
          score(format: POINT_100)
          media {
            id
            title {
              native
            }
          }
        }
      }
    }

    query { ${queriedUsers} }
  `;
}

export const Fetcher: React.FC<
  {
    style?: React.CSSProperties;
    className?: string;
    userList: string[];
    mode: DrawMode;
  }
> = ({ userList, style, className, mode }) => {
  const { data } = useSWR<DataSet>(
    [userList],
    (l: string[]) => anilistClient.request<UserMap>(makeQuery(l)).then(aggregate),
    {
      suspense: true,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      refreshInterval: 0,
    });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div style={style} className={clsx(className)}>
      <SigmaContainer>
        <GraphSettingsController hoveredNode={hoveredNode} />
        <GraphEventsController setHoveredNode={(node) => setHoveredNode(node)} />
        <GraphDataController
          dataset={
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            data!
          }
          mode={mode}
        />
        <ControlsContainer position={"bottom-right"}>
          <ZoomControl />
          <FullScreenControl />
        </ControlsContainer>
        <ControlsContainer position={"top-right"}>
          <AnimeSearchControl />
        </ControlsContainer>
      </SigmaContainer>
    </div>
    );
};

export const Page: React.FC = () => {
  const rawUsers = useURLParams("users");
  const mode: DrawMode = (useURLParams("mode") ?? "COUNT") as DrawMode;

  const users = useMemo(() => rawUsers?.split(",") || [], [rawUsers]);

  return (
    <div
      className={clsx(
        "relative",
        "w-full",
        "h-screen",
      )}
    >
      <a
        target="_blank"
        rel="noreferrer"
        href="https://github.com/pois0/i-love-love-you-you-love-love-me"
        className={clsx(
          ["absolute", ["left-2", "bottom-2"], ["z-50"]],
          ["px-4", "py-2"],
          ["text-md", "text-white"],
          ["rounded-md"],
          ["bg-slate-600", "hover:bg-slate-700", "bg-opacity-75", "backdrop-blur-sm"],
        )}
      >
        GitHub
      </a>
      <Suspense fallback={<span>Loading</span>}>
        <Fetcher
          style={{ width: "100%", height: "100%" }}
          userList={users}
          mode={mode}
        />
      </Suspense>
    </div>
  );
};

function aggregate(userMap: UserMap): DataSet {
  const users = Object.values(userMap).map((it) => it.user);
  const animes = new Map<number, Anime>();
  const statuses = Object.values(userMap).flatMap(({ user, lists }) =>{
    return lists.flatMap((group) => {
      const status = group.status;
      const userStat = user.statistics.anime;
      if (!status) return [];
      if (status !== "CURRENT" && status !== "COMPLETED") return [];

      return group.entries.map(({ media, score: rawScore }) => {
        const score = rawScore == 0 ? null : zScore(userStat, rawScore);

        const anime = animes.get(media.id);
        if (anime) {
          anime.scores.push(score);
        } else {
          animes.set(media.id, { id: media.id, title: media.title.native, scores: [score] });
        }
        return {
          userId: user.id,
          animeId: media.id,
          status,
          score,
        };
      });
    });
  });

  return { users, animes: Array.from(animes.values()), statuses };
}

function zScore(userStat: UserStat, score: number): number {
  return (score - userStat.meanScore) / userStat.standardDeviation;
}
