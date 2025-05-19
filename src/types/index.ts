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

// 基础关键词数据接口
export interface BaseKeywordData {
  keyword: string;
  platform: PlatformType; // 记录数据来源平台
  captured_at: number;
  source_url?: string;
}

// Sim3ue平台特定的关键词数据
export interface Sim3ueKeywordData extends BaseKeywordData {
  platform: 'sim3ue';
  volume: string;
  clicks: string;
  clickThroughRate: string;
  difficulty: string;
  devices?: {
    desktop: string;
    mobile: string;
  };
  trends?: {
    chartUrl?: string;
    chartBase64?: string;
  };
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
}

// Sumrush平台特定的关键词数据
export interface SumrushKeywordData extends BaseKeywordData {
  platform: 'sumrush';
  volume: string;
  difficulty: number;
  region: {
    code: string;
    name: string;
  };
  countryDistribution: Record<string, string>;
  trends?: {
    chartUrl?: string;
    chartBase64?: string;
  };
  relatedKeywords?: Array<{
    keyword: string;
    volume: string;
    difficulty: number;
  }>;
  topCompetitors?: Array<{
    website: string;
    traffic: string;
  }>;
}

// 通用关键词数据（用于其他平台或未知平台）
export interface GenericKeywordData extends BaseKeywordData {
  volume?: string | number;
  difficulty?: string | number;
  [key: string]: any; // 允许添加其他字段
}

// 联合类型，表示所有可能的关键词数据类型
export type KeywordData = Sim3ueKeywordData | SumrushKeywordData | GenericKeywordData;

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