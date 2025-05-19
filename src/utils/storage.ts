/**
 * KeywordAssistant 存储工具函数
 */

import { Backlink, SiteConfig, KeywordAssistantStorage, SubdomainData } from '../types';

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
    
    // 检查是否已存在相同URL的外链
    const existingIndex = backlinks.findIndex(b => b.source_url === backlink.source_url);
    
    if (existingIndex >= 0) {
      // 更新现有外链
      backlinks[existingIndex] = {
        ...backlinks[existingIndex],
        ...backlink,
        updated_at: Date.now()
      };
    } else {
      // 添加新外链
      backlinks.push({
        ...backlink,
        created_at: Date.now(),
        updated_at: Date.now()
      });
    }
      
    return await saveBacklinks(backlinks);
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
    return site_config || { name: '', domain: '', tags: [], industry: '' };
  } catch (error) {
    console.error('获取站点配置失败:', error);
    return { name: '', domain: '', tags: [], industry: '' };
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
 * 获取所有子域名/子文件夹数据
 * @returns Promise<SubdomainData[]>
 */
export const getSubdomains = async (): Promise<SubdomainData[]> => {
  try {
    const { subdomains = [] } = await chrome.storage.local.get('subdomains');
    return subdomains;
  } catch (error) {
    console.error('获取子域名/子文件夹数据失败:', error);
    return [];
  }
};

/**
 * 保存子域名/子文件夹数据
 * @param subdomains 子域名/子文件夹数据
 * @returns Promise<boolean>
 */
export const saveSubdomains = async (subdomains: SubdomainData[]): Promise<boolean> => {
  try {
    await chrome.storage.local.set({ subdomains });
    return true;
  } catch (error) {
    console.error('保存子域名/子文件夹数据失败:', error);
    return false;
  }
};

/**
 * 添加新子域名/子文件夹数据
 * @param subdomain 子域名/子文件夹数据
 * @returns Promise<boolean>
 */
export const addSubdomain = async (subdomain: SubdomainData): Promise<boolean> => {
  try {
    const subdomains = await getSubdomains();
    
    // 检查是否已存在相同域名的数据
    const existingIndex = subdomains.findIndex(s => s.domain === subdomain.domain);
    
    if (existingIndex >= 0) {
      // 更新现有数据
      subdomains[existingIndex] = {
        ...subdomains[existingIndex],
        ...subdomain,
        updated_at: Date.now()
      };
    } else {
      // 添加新数据
      subdomains.push({
        ...subdomain,
        created_at: Date.now(),
        updated_at: Date.now()
      });
    }
    
    return await saveSubdomains(subdomains);
  } catch (error) {
    console.error('添加子域名/子文件夹数据失败:', error);
    return false;
  }
};

/**
 * 批量添加子域名/子文件夹数据
 * @param newSubdomains 子域名/子文件夹数据数组
 * @returns Promise<{success: boolean, added: number, duplicates: number}>
 */
export const addSubdomainsBatch = async (newSubdomains: SubdomainData[]): Promise<{success: boolean, added: number, duplicates: number}> => {
  try {
    const subdomains = await getSubdomains();
    let added = 0;
    let duplicates = 0;
    
    // 当前时间戳
    const now = Date.now();
    
    // 处理每个新子域名/子文件夹
    for (const newItem of newSubdomains) {
      // 检查是否已存在
      const existingIndex = subdomains.findIndex(s => s.domain === newItem.domain);
      
      if (existingIndex >= 0) {
        // 更新现有数据
        subdomains[existingIndex] = {
          ...subdomains[existingIndex],
          ...newItem,
          updated_at: now
        };
        duplicates++;
      } else {
        // 添加新数据
        subdomains.push({
          ...newItem,
          created_at: now,
          updated_at: now
        });
        added++;
      }
    }
    
    // 保存更新后的数据
    const success = await saveSubdomains(subdomains);
    return { success, added, duplicates };
  } catch (error) {
    console.error('批量添加子域名/子文件夹数据失败:', error);
    return { success: false, added: 0, duplicates: 0 };
  }
};

/**
 * 删除子域名/子文件夹数据
 * @param domain 要删除的子域名/子文件夹
 * @returns Promise<boolean>
 */
export const deleteSubdomain = async (domain: string): Promise<boolean> => {
  try {
    const subdomains = await getSubdomains();
    const filteredSubdomains = subdomains.filter(s => s.domain !== domain);
    
    // 如果长度相同，说明没有找到要删除的项
    if (filteredSubdomains.length === subdomains.length) {
      return false;
    }
    
    return await saveSubdomains(filteredSubdomains);
  } catch (error) {
    console.error('删除子域名/子文件夹数据失败:', error);
    return false;
  }
};

/**
 * 清空所有存储数据
 * @returns Promise<boolean>
 */
export const clearAllStorage = async (): Promise<boolean> => {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('清空存储失败:', error);
    return false;
  }
};

/**
 * 导出所有数据
 * @returns Promise<KeywordAssistantStorage>
 */
export const exportAllData = async (): Promise<KeywordAssistantStorage> => {
  try {
    const backlinks = await getBacklinks();
    const site_config = await getSiteConfig();
    const subdomains = await getSubdomains();
    
    return {
      backlinks,
      site_config,
      subdomains
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