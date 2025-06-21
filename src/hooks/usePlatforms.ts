import { useState, useEffect } from 'react';
import { Platform, PlatformAccount } from '../types/platform';

const initialPlatforms: Platform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    gradient: 'from-blue-600 to-blue-700',
    icon: 'facebook',
    connected: false,
    followers: 0
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    gradient: 'from-pink-500 via-red-500 to-yellow-500',
    icon: 'instagram',
    connected: false,
    followers: 0
  },
  {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    gradient: 'from-red-600 to-red-700',
    icon: 'youtube',
    connected: false,
    followers: 0
  },
  {
    id: 'twitter',
    name: 'Twitter',
    color: '#1DA1F2',
    gradient: 'from-blue-400 to-blue-600',
    icon: 'twitter',
    connected: false,
    followers: 0
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    gradient: 'from-blue-700 to-blue-800',
    icon: 'linkedin',
    connected: false,
    followers: 0
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    gradient: 'from-gray-900 to-black',
    icon: 'music',
    connected: false,
    followers: 0
  }
];

export const usePlatforms = () => {
  const [platforms] = useState<Platform[]>(initialPlatforms);
  const [accounts, setAccounts] = useState<PlatformAccount[]>(() => {
    const saved = localStorage.getItem('platformAccounts');
    return saved ? JSON.parse(saved).map((account: any) => ({
      ...account,
      createdAt: new Date(account.createdAt)
    })) : [];
  });

  useEffect(() => {
    localStorage.setItem('platformAccounts', JSON.stringify(accounts));
  }, [accounts]);

  const addAccount = (platformId: string, accountName: string, accessToken: string, profileInfo?: any) => {
    const platform = platforms.find(p => p.id === platformId);
    if (!platform) return;

    const newAccount: PlatformAccount = {
      id: crypto.randomUUID(),
      platformId,
      platformName: platform.name,
      accountName,
      accessToken,
      connected: true,
      profileInfo,
      createdAt: new Date(),
      color: platform.color,
      gradient: platform.gradient,
      icon: platform.icon,
      lastPost: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAccount]);
    return newAccount;
  };

  const updateAccount = (accountId: string, updates: Partial<PlatformAccount>) => {
    setAccounts(prev => 
      prev.map(account => 
        account.id === accountId 
          ? { ...account, ...updates }
          : account
      )
    );
  };

  const removeAccount = (accountId: string) => {
    setAccounts(prev => prev.filter(account => account.id !== accountId));
  };

  const getAccountsByPlatform = (platformId: string) => {
    return accounts.filter(account => account.platformId === platformId);
  };

  const getConnectedAccounts = () => {
    return accounts.filter(account => account.connected);
  };

  // Legacy methods for backward compatibility
  const connectPlatform = (platformId: string, accessToken: string) => {
    const platform = platforms.find(p => p.id === platformId);
    if (platform) {
      addAccount(platformId, `${platform.name} Account`, accessToken);
    }
  };

  const disconnectPlatform = (platformId: string) => {
    // Remove all accounts for this platform
    setAccounts(prev => prev.filter(account => account.platformId !== platformId));
  };

  return {
    platforms,
    accounts,
    addAccount,
    updateAccount,
    removeAccount,
    getAccountsByPlatform,
    getConnectedAccounts,
    // Legacy methods
    connectPlatform,
    disconnectPlatform
  };
};