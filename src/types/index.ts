// LinkPilot插件类型定义

export type LinkStatus = 'pending' | 'submitted' | 'success' | 'failed' | 'ignored';

export type LinkType = 'blog' | 'forum' | 'directory' | 'paid' | 'other';

export type PlatformType = 'wordpress' | 'disqus' | 'custom' | 'unknown';

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

export interface SiteConfig {
  name: string;
  domain: string;
  tags: string[];
  industry: string;
}

export interface LinkPilotStorage {
  backlinks: Backlink[];
  site_config: SiteConfig;
}

export interface MessagePayload {
  action: string;
  data: any;
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