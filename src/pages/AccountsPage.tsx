import React from 'react';
import { PlatformCard } from '../components/PlatformCard';
import { Platform, PlatformAccount } from '../types/platform';
import { Users, Plus, CheckCircle, AlertCircle } from 'lucide-react';

interface AccountsPageProps {
  platforms: Platform[];
  accounts: PlatformAccount[];
  onAddAccount: (platformId: string, accountName: string, accessToken: string, profileInfo?: any) => void;
  onUpdateAccount: (accountId: string, updates: Partial<PlatformAccount>) => void;
  onRemoveAccount: (accountId: string) => void;
  getAccountsByPlatform: (platformId: string) => PlatformAccount[];
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  platforms,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onRemoveAccount,
  getAccountsByPlatform
}) => {
  const connectedAccounts = accounts.filter(acc => acc.connected);
  const totalFollowers = connectedAccounts.reduce((total, acc) => total + (acc.profileInfo?.followers || 0), 0);

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Account Management
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Connect and manage all your social media accounts in one place. Add multiple accounts 
          per platform and control your entire social media presence from a single dashboard.
        </p>
      </div>

      {/* Stats Overview */}
      <section className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="text-blue-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{connectedAccounts.length}</div>
              <div className="text-sm text-gray-600">Connected Accounts</div>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">{platforms.length}</div>
              <div className="text-sm text-gray-600">Supported Platforms</div>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">👥</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatFollowerCount(totalFollowers)}</div>
              <div className="text-sm text-gray-600">Total Reach</div>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="text-yellow-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-gray-900">∞</div>
              <div className="text-sm text-gray-600">Accounts per Platform</div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Connections */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            Platform Connections
          </h3>
          <div className="text-sm text-gray-600">
            {connectedAccounts.length} of {platforms.length * 10} possible accounts connected
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {platforms.map((platform) => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              accounts={getAccountsByPlatform(platform.id)}
              onAddAccount={onAddAccount}
              onUpdateAccount={onUpdateAccount}
              onRemoveAccount={onRemoveAccount}
            />
          ))}
        </div>
      </section>

      {/* API Information */}
      <section className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Latest API Integrations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📘</span>
              <div>
                <h4 className="font-semibold">Facebook API v23.0</h4>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Latest</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Enhanced Page posting with improved media handling and targeting options
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📷</span>
              <div>
                <h4 className="font-semibold">Instagram API v23.0</h4>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">Latest</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Advanced carousel posting and video thumbnail generation
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🐦</span>
              <div>
                <h4 className="font-semibold">Twitter API v2</h4>
                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Stable</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Full media support with enhanced error handling and analytics
            </p>
          </div>
        </div>
      </section>

      {/* Getting Started Guide */}
      {connectedAccounts.length === 0 && (
        <section className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">1</span>
                </div>
                Choose a Platform
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Click on any platform card above to start connecting your accounts. Each platform 
                supports multiple accounts with custom names.
              </p>
              
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-purple-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">2</span>
                </div>
                Get Your Access Token
              </h4>
              <p className="text-sm text-gray-600">
                Visit the platform's developer console to generate an access token. We provide 
                direct links and detailed instructions for each platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">3</span>
                </div>
                Connect & Verify
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Enter your access token and account name. We'll automatically verify the connection 
                and fetch your profile information.
              </p>
              
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <div className="bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center">
                  <span className="text-sm">4</span>
                </div>
                Start Posting
              </h4>
              <p className="text-sm text-gray-600">
                Once connected, go to the Posts page to start creating and scheduling content 
                across all your accounts.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Account Management Tips */}
      {connectedAccounts.length > 0 && (
        <section className="bg-white rounded-xl p-8 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Account Management Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Custom Account Names</h4>
                  <p className="text-sm text-gray-600">
                    Use descriptive names like "Business Page" or "Personal Account" to easily identify accounts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Token Security</h4>
                  <p className="text-sm text-gray-600">
                    Your access tokens are encrypted and stored locally. Never share them with others
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Token Expiration</h4>
                  <p className="text-sm text-gray-600">
                    Some tokens expire periodically. Update them when you receive authentication errors
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <AlertCircle className="text-yellow-500 flex-shrink-0 mt-0.5" size={16} />
                <div>
                  <h4 className="font-medium text-gray-900">Platform Limits</h4>
                  <p className="text-sm text-gray-600">
                    Each platform has different posting limits and media requirements. Check validation messages
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};