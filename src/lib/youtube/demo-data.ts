import type {
  ChannelItem,
  PlaylistItem,
  SearchResult,
  SearchType,
  VideoItem,
} from "./types";

export const DEMO_VIDEOS: VideoItem[] = [
  {
    id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny",
    description:
      "A large and lovable rabbit deals with three tiny bullies in this open-source animated short.",
    channelId: "UCssB5_Sbd585NZOjyNUzb_w",
    channelTitle: "Blender Foundation",
    publishedAt: "2013-04-01T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    duration: "PT10M34S",
    viewCount: "12000000",
  },
  {
    id: "eRsGyueVLvQ",
    title: "Sintel — Open Movie",
    description:
      "A lonely young woman finds a baby dragon and sets out on a quest across a damaged world.",
    channelId: "UCssB5_Sbd585NZOjyNUzb_w",
    channelTitle: "Blender Foundation",
    publishedAt: "2010-09-30T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/eRsGyueVLvQ/hqdefault.jpg",
    duration: "PT14M48S",
    viewCount: "8900000",
  },
  {
    id: "YE7VzlLtp-4",
    title: "Big Buck Bunny 60fps 4K",
    description: "The classic open movie presented in a higher-framerate cut.",
    channelId: "UCX6OQ3DkcsbYNE6H8uQQuVA",
    channelTitle: "Blender",
    publishedAt: "2018-06-11T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/YE7VzlLtp-4/hqdefault.jpg",
    duration: "PT10M34S",
    viewCount: "45000000",
  },
  {
    id: "LXb3EKWsInQ",
    title: "Costa Rica in 4K",
    description:
      "Travel through rainforests, coasts, and volcanoes in a cinematic 4K nature film.",
    channelId: "UCRijo3ddMTht_IHyNSNXpNQ",
    channelTitle: "Jacob + Katie Schwarz",
    publishedAt: "2016-08-14T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    duration: "PT5M12S",
    viewCount: "280000000",
  },
  {
    id: "ScMzIvxBSi4",
    title: "The Beauty of Chaos",
    description: "A calm visual journey through patterns, water, and light.",
    channelId: "UCsXVk37bltHxD1rDPwtNM8Q",
    channelTitle: "Kurzgesagt – In a Nutshell",
    publishedAt: "2019-03-21T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/ScMzIvxBSi4/hqdefault.jpg",
    duration: "PT9M59S",
    viewCount: "18000000",
  },
  {
    id: "jNQXAC9IVRw",
    title: "Me at the zoo",
    description: "The first video ever uploaded to YouTube.",
    channelId: "UC4QobU6STSB0a-J95yzOxZQ",
    channelTitle: "jawed",
    publishedAt: "2005-04-23T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/jNQXAC9IVRw/hqdefault.jpg",
    duration: "PT19S",
    viewCount: "340000000",
  },
  {
    id: "M7lc1UVf-VE",
    title: "YouTube Developers Live: Embedded Web Player",
    description:
      "A walkthrough of the YouTube iframe player API for embedding videos on other sites.",
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    channelTitle: "Google for Developers",
    publishedAt: "2012-10-24T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    duration: "PT1H15M",
    viewCount: "9200000",
  },
  {
    id: "9xwazD5SyVA",
    title: "Elephant's Dream",
    description:
      "Two characters explore a surreal machine world in the first open movie from Blender.",
    channelId: "UCssB5_Sbd585NZOjyNUzb_w",
    channelTitle: "Blender Foundation",
    publishedAt: "2006-05-24T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/9xwazD5SyVA/hqdefault.jpg",
    duration: "PT10M54S",
    viewCount: "3200000",
  },
  {
    id: "k5Z7sFwFF7Q",
    title: "Become a NASA Astronaut!",
    description:
      "Applications are open to join NASA's astronaut corps.",
    channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
    channelTitle: "NASA",
    publishedAt: "2026-11-07T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/k5Z7sFwFF7Q/hqdefault.jpg",
    viewCount: "33000",
    playback: "short",
  },
  {
    id: "myZ9kn9MIWQ",
    title: "2026 Solar Eclipse @ 50,000 Feet",
    description: "A NASA Short.",
    channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
    channelTitle: "NASA",
    publishedAt: "2026-08-01T00:00:00Z",
    thumbnail: "https://i.ytimg.com/vi/myZ9kn9MIWQ/hqdefault.jpg",
    viewCount: "12000",
    playback: "short",
  },
  {
    id: "ROboUHfPUrU",
    title: "Live High-Definition Views from the International Space Station (Official NASA Stream)",
    description:
      "Live views from an external camera mounted on the International Space Station.",
    channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
    channelTitle: "NASA",
    publishedAt: "Started streaming on Oct 22, 2026",
    thumbnail: "https://i.ytimg.com/vi/ROboUHfPUrU/hqdefault.jpg",
    playback: "live",
  },
  {
    id: "25JEQqgv5I4",
    title: "U.S. Spacewalk 101",
    description: "A recorded NASA spacewalk from the International Space Station.",
    channelId: "UCLA_DiR1FfKNvjuUpBHmylQ",
    channelTitle: "NASA",
    publishedAt: "Streamed 2 days ago",
    thumbnail: "https://i.ytimg.com/vi/25JEQqgv5I4/hqdefault.jpg",
    duration: "9:09:18",
    playback: "vod",
  },
];

export const DEMO_CHANNELS: ChannelItem[] = [
  {
    id: "UCssB5_Sbd585NZOjyNUzb_w",
    title: "Blender Foundation",
    description:
      "Open movies, software demos, and community highlights from the Blender project.",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    subscriberCount: "1200000",
    videoCount: "420",
    customUrl: "@BlenderFoundation",
  },
  {
    id: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    title: "Google for Developers",
    description: "Talks, tutorials, and product updates for builders.",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    subscriberCount: "2500000",
    videoCount: "5800",
    customUrl: "@GoogleDevelopers",
  },
  {
    id: "UCsXVk37bltHxD1rDPwtNM8Q",
    title: "Kurzgesagt – In a Nutshell",
    description: "Science explained with animation and a soft voice.",
    thumbnail: "https://i.ytimg.com/vi/ScMzIvxBSi4/hqdefault.jpg",
    subscriberCount: "23000000",
    videoCount: "240",
    customUrl: "@kurzgesagt",
  },
  {
    id: "UCRijo3ddMTht_IHyNSNXpNQ",
    title: "Jacob + Katie Schwarz",
    description: "Travel films and cinematic edits from around the world.",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    subscriberCount: "1800000",
    videoCount: "90",
    customUrl: "@JacobKatieSchwarz",
  },
  {
    id: "UCLA_DiR1FfKNvjuUpBHmylQ",
    title: "NASA",
    description: "NASA's official YouTube channel.",
    thumbnail: "https://i.ytimg.com/vi/ROboUHfPUrU/hqdefault.jpg",
    customUrl: "@NASA",
  },
];

export const DEMO_PLAYLISTS: PlaylistItem[] = [
  {
    id: "PLDemoOpenMoviesKino",
    title: "Open Movies Collection",
    description: "Free and open animated films you can watch right away.",
    channelId: "UCssB5_Sbd585NZOjyNUzb_w",
    channelTitle: "Blender Foundation",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    itemCount: 4,
    publishedAt: "2020-01-01T00:00:00Z",
  },
  {
    id: "PLDemoTravelKino",
    title: "Travel & Nature",
    description: "Calm 4K journeys and landscape films.",
    channelId: "UCRijo3ddMTht_IHyNSNXpNQ",
    channelTitle: "Jacob + Katie Schwarz",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    itemCount: 2,
    publishedAt: "2021-06-01T00:00:00Z",
  },
  {
    id: "PLDemoDevKino",
    title: "Developer Talks",
    description: "Embedding, APIs, and building with video.",
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    channelTitle: "Google for Developers",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    itemCount: 1,
    publishedAt: "2018-01-01T00:00:00Z",
  },
];

const PLAYLIST_VIDEOS: Record<string, string[]> = {
  PLDemoOpenMoviesKino: ["aqz-KE-bpKQ", "eRsGyueVLvQ", "YE7VzlLtp-4", "9xwazD5SyVA"],
  PLDemoTravelKino: ["LXb3EKWsInQ", "ScMzIvxBSi4"],
  PLDemoDevKino: ["M7lc1UVf-VE"],
};

const CHANNEL_VIDEOS: Record<string, string[]> = {
  UCssB5_Sbd585NZOjyNUzb_w: ["aqz-KE-bpKQ", "eRsGyueVLvQ", "9xwazD5SyVA"],
  UC_x5XG1OV2P6uZZ5FSM9Ttw: ["M7lc1UVf-VE"],
  UCsXVk37bltHxD1rDPwtNM8Q: ["ScMzIvxBSi4"],
  UCRijo3ddMTht_IHyNSNXpNQ: ["LXb3EKWsInQ"],
  UCX6OQ3DkcsbYNE6H8uQQuVA: ["YE7VzlLtp-4"],
  "UC4QobU6STSB0a-J95yzOxZQ": ["jNQXAC9IVRw"],
  UCLA_DiR1FfKNvjuUpBHmylQ: ["25JEQqgv5I4"],
};

const CHANNEL_SHORTS: Record<string, string[]> = {
  UCLA_DiR1FfKNvjuUpBHmylQ: ["k5Z7sFwFF7Q", "myZ9kn9MIWQ"],
};

const CHANNEL_LIVE: Record<string, string[]> = {
  UCLA_DiR1FfKNvjuUpBHmylQ: ["ROboUHfPUrU", "25JEQqgv5I4"],
};

function matchesQuery(haystack: string, query: string) {
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const target = haystack.toLowerCase();
  return tokens.every((token) => target.includes(token));
}

function videoMatches(item: VideoItem, type: SearchType) {
  if (type === "short") return item.playback === "short";
  if (type === "live") return item.playback === "live" || item.playback === "vod";
  if (type === "video") return item.playback !== "short";
  return true;
}

export function demoSearch(
  query: string,
  type: SearchType = "all",
): SearchResult[] {
  const q = query.trim();
  const results: SearchResult[] = [];

  if (type === "all" || type === "video" || type === "short" || type === "live") {
    for (const item of DEMO_VIDEOS) {
      if (!videoMatches(item, type)) continue;
      if (!q || matchesQuery(`${item.title} ${item.channelTitle} ${item.description}`, q)) {
        results.push({ kind: "video", item });
      }
    }
  }

  if (type === "all" || type === "channel") {
    for (const item of DEMO_CHANNELS) {
      if (!q || matchesQuery(`${item.title} ${item.description}`, q)) {
        results.push({ kind: "channel", item });
      }
    }
  }

  if (type === "all" || type === "playlist") {
    for (const item of DEMO_PLAYLISTS) {
      if (!q || matchesQuery(`${item.title} ${item.description} ${item.channelTitle}`, q)) {
        results.push({ kind: "playlist", item });
      }
    }
  }

  return results;
}

export function demoGetVideos(ids: string[]): VideoItem[] {
  return ids
    .map((id) => DEMO_VIDEOS.find((video) => video.id === id))
    .filter((video): video is VideoItem => Boolean(video));
}

export function demoGetChannels(ids: string[]): ChannelItem[] {
  return ids
    .map((id) => DEMO_CHANNELS.find((channel) => channel.id === id))
    .filter((channel): channel is ChannelItem => Boolean(channel));
}

export function demoGetPlaylists(ids: string[]): PlaylistItem[] {
  return ids
    .map((id) => DEMO_PLAYLISTS.find((playlist) => playlist.id === id))
    .filter((playlist): playlist is PlaylistItem => Boolean(playlist));
}

export function demoPlaylistItems(playlistId: string): VideoItem[] {
  const ids = PLAYLIST_VIDEOS[playlistId] ?? [];
  return demoGetVideos(ids);
}

export function demoChannelVideos(channelId: string): VideoItem[] {
  const ids = CHANNEL_VIDEOS[channelId] ?? [];
  return demoGetVideos(ids);
}

export function demoChannelShorts(channelId: string): VideoItem[] {
  const ids = CHANNEL_SHORTS[channelId];
  if (ids) return demoGetVideos(ids);
  return DEMO_VIDEOS.filter((video) => video.playback === "short");
}

export function demoChannelLive(channelId: string): VideoItem[] {
  const ids = CHANNEL_LIVE[channelId];
  if (ids) return demoGetVideos(ids);
  return DEMO_VIDEOS.filter(
    (video) => video.playback === "live" || video.playback === "vod",
  );
}

export function demoRelated(videoId: string): VideoItem[] {
  return DEMO_VIDEOS.filter((video) => video.id !== videoId).slice(0, 8);
}
