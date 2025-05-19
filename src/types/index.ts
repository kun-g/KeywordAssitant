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
  cpc: string;
  competition: string;
  results: string;
  position?: number;
  clickThroughRate?: string;
  difficulty?: string;
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

// Semrush平台特定的关键词数据
export interface SumrushKeywordData extends BaseKeywordData {
  platform: 'sumrush';
  volume: string;
  kd: string;
  cpc: string;
  competition: string;
  results: string;
  difficulty?: string;
  region?: {
    name: string;
    code: string;
  };
  countryDistribution?: Record<string, string>;
  trends?: {
    chartUrl?: string;
    chartBase64?: string;
  };
  relatedKeywords?: Array<{
    keyword: string;
    volume: string;
    difficulty: string;
  }>;
  topCompetitors?: Array<{
    website: string;
    traffic: string;
  }>;
  intent?: string;
}

// 通用关键词数据类型
export type KeywordData = Sim3ueKeywordData | SumrushKeywordData;

// 站点配置
export interface SiteConfig {
  name: string;
  domain: string;
  tags: string[];
  industry: string;
}

// 子域名/子文件夹数据接口
export interface SubdomainData {
  domain: string;
  link: string;
  traffic: string;
  desktopShare: string;
  mobileShare: string;
  isSubdomain: boolean;
  parentDomain: string;
  created_at: number;
  updated_at: number;
}

// 插件存储结构
export interface KeywordAssistantStorage {
  backlinks: Backlink[];
  site_config: SiteConfig;
  keywords: KeywordData[];
  subdomains: SubdomainData[];
}

// 消息类型定义
export interface MessagePayload {
  action: string;
  [key: string]: any;
}

// 子域名/子文件夹数据获取消息
export interface SubdomainDataFetchedMessage extends MessagePayload {
  action: 'subdomain_data_fetched';
  data: SubdomainData[];
}

// 关键词数据获取消息
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