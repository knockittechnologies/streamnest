export type ChannelSummary = {
  id: string;
  name: string;
  category: string;
  channelNumber: number;
  isLive: boolean;
  colorFrom: string;
  colorTo: string;
  hasStream: boolean;
  favorite: boolean;
  progress: number | null;
  lastWatchedAt: string | null;
};

export type ChannelDetail = ChannelSummary & {
  streamUrl: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
};

export const CATEGORIES = [
  'Tamil', 'News', 'Sports', 'Entertainment', 'Music', 'Kids', 'Movies', 'International',
] as const;
