// KeywordAssistant插件类型定义

export type LinkStatus = 'pending' | 'submitted' | 'success' | 'failed' | 'ignored';

export type LinkType = 'blog' | 'forum' | 'directory' | 'paid' | 'other';

export type PlatformType = 'ahrefs' | 'custom' | 'unknown' | 'sim3ue' | 'sumrush';

export interface Backlink {
  id: string;
  source_url: string;
  anchor: string;
  target_url: string;
  type: LinkType;
  platform: PlatformType;
  nofollow: boolean;
  status: LinkStatus;
  comment?: string;
  error?: string;
  tags?: string[];
  industry?: string;
  created_at: number;
  updated_at: number;
}

export interface KeywordData {
  keyword: string;
  volume?: string | number;
  clicks?: string | number;
  clickThroughRate?: string | number;
  serp?: {
    organic?: number;
    features?: number;
    ads?: number;
    pla?: number;
  };
  devices?: {
    desktop?: string | number;
    mobile?: string | number;
  };
  trends?: {
    current: string;
    change: string;
    chartUrl: string;
    chartBase64?: string;
  };
  difficulty?: string | number;
  relatedKeywords?: Array<{
    keyword: string;
    volume: string;
    clickThroughRate: string;
    kd: string;
  }>;
  topCompetitors?: Array<{
    website: string;
    clicks: string;
  }>;
  captured_at?: number;
  source_url?: string;
}

export interface SiteConfig {
  name: string;
  domain: string;
  tags: string[];
  industry: string;
}

export interface KeywordAssistantStorage {
  backlinks: Backlink[];
  site_config: SiteConfig;
  keywords?: KeywordData[];
}

export interface MessagePayload {
  action: string;
  data: any;
}

export interface KeywordDataFetchedMessage extends MessagePayload {
  action: 'keyword_data_fetched';
  data: KeywordData;
}

export interface SubmitLinkRequest {
  id: string;
  source_url: string;
  comment: string;
}

export interface SubmitLinkResponse {
  success: boolean;
  error?: string;
} 