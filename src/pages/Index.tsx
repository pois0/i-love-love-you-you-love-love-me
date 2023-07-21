import { ControlsContainer, FullScreenControl, SearchControl, SigmaContainer, ZoomControl } from "@react-sigma/core";
import clsx from "clsx";
import { GraphQLClient } from "graphql-request";
import React, { Suspense, useMemo, useState } from "react";
import useSWR from "swr";

import { useURLParams } from "~/hooks/useURLParams";
import { AnimeSearchControl } from "./AnimeSearchControl";

import { GraphDataController } from "./GraphDataController";
import { GraphEventsController } from "./GraphEventsController";
import { GraphSettingsController } from "./GraphSettingsController";
import { Anime, DataSet, UserMap } from "./types";

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
      }
      lists {
        status
        entries {
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
  }
> = ({ userList, style, className }) => {
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
        href="https://github.com/SnO2WMaN/i-love-love-you-you-love-love-me"
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
      if (!status) return [];
      if (status !== "CURRENT" && status !== "COMPLETED") return [];

      return group.entries.map(({ media }) => {
        const anime = animes.get(media.id)
        if (anime) {
          anime.size++;
        } else {
          animes.set(media.id, { id: media.id, title: media.title.native, size: 1 });
        }
        return {
          userId: user.id,
          animeId: media.id,
          status
        };
      });
    });
  });

  return { users, animes: Array.from(animes.values()), statuses };
}
