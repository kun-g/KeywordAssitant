/**
 * LinkPilot 存储工具函数
 */

import { Backlink, SiteConfig, LinkPilotStorage } from '../types';

/**
 * 获取所有外链数据
 * @returns Promise<Backlink[]>
 */
export const getBacklinks = async (): Promise<Backlink[]> => {
  try {
    const { backlinks = [] } = await chrome.storage.local.get('backlinks');
    return backlinks;
  } catch (error) {
    console.error('获取外链数据失败:', error);
    return [];
  }
};

/**
 * 保存外链数据
 * @param backlinks 外链数据
 * @returns Promise<boolean>
 */
export const saveBacklinks = async (backlinks: Backlink[]): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ backlinks });
    return true;
  } catch (error) {
    console.error('保存外链数据失败:', error);
    return false;
  }
};

/**
 * 添加新外链
 * @param backlink 外链数据
 * @returns Promise<boolean>
 */
export const addBacklink = async (backlink: Backlink): Promise<boolean> => {
  try {
    const backlinks = await getBacklinks();
    
    // 检查是否已存在相同的外链
    const exists = backlinks.some(link => link.source_url === backlink.source_url);
    
    if (!exists) {
      const updatedBacklinks = [...backlinks, {
        ...backlink,
        id: backlink.id || Date.now().toString(),
        created_at: backlink.created_at || Date.now(),
        updated_at: backlink.updated_at || Date.now()
      }];
      
      return await saveBacklinks(updatedBacklinks);
    }
    
    return false;
  } catch (error) {
    console.error('添加外链失败:', error);
    return false;
  }
};

/**
 * 更新外链状态
 * @param id 外链ID
 * @param status 新状态
 * @param error 错误信息（可选）
 * @returns Promise<boolean>
 */
export const updateBacklinkStatus = async (
  id: string,
  status: 'pending' | 'submitted' | 'success' | 'failed' | 'ignored',
  error?: string
): Promise<boolean> => {
  try {
    const backlinks = await getBacklinks();
    const updatedBacklinks = backlinks.map(link => {
      if (link.id === id) {
        return {
          ...link,
          status,
          error,
          updated_at: Date.now()
        };
      }
      return link;
    });
    
    return await saveBacklinks(updatedBacklinks);
  } catch (error) {
    console.error('更新外链状态失败:', error);
    return false;
  }
};

/**
 * 获取站点配置
 * @returns Promise<SiteConfig>
 */
export const getSiteConfig = async (): Promise<SiteConfig> => {
  try {
    const { site_config } = await chrome.storage.local.get('site_config');
    
    if (!site_config) {
      // 默认站点配置
      return {
        name: '',
        domain: '',
        tags: [],
        industry: ''
      };
    }
    
    return site_config;
  } catch (error) {
    console.error('获取站点配置失败:', error);
    return {
      name: '',
      domain: '',
      tags: [],
      industry: ''
    };
  }
};

/**
 * 保存站点配置
 * @param config 站点配置
 * @returns Promise<boolean>
 */
export const saveSiteConfig = async (config: SiteConfig): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ site_config: config });
    return true;
  } catch (error) {
    console.error('保存站点配置失败:', error);
    return false;
  }
};

/**
 * 导出所有数据
 * @returns Promise<LinkPilotStorage>
 */
export const exportAllData = async (): Promise<LinkPilotStorage> => {
  try {
    const backlinks = await getBacklinks();
    const site_config = await getSiteConfig();
    
    return {
      backlinks,
      site_config
    };
  } catch (error) {
    console.error('导出数据失败:', error);
    return {
      backlinks: [],
      site_config: {
        name: '',
        domain: '',
        tags: [],
        industry: ''
      }
    };
  }
}; 