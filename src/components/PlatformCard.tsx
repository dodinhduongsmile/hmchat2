import React, { useState } from 'react';
import { Platform, PlatformAccount } from '../types/platform';
import { Link, Unlink, Settings, Users, Calendar, CheckCircle, AlertCircle, Zap, Plus, Edit2, Trash2, User, Star, Globe, Eye } from 'lucide-react';
import { apiService } from '../services/apiService';

interface PlatformCardProps {
  platform: Platform;
  accounts: PlatformAccount[];
  onAddAccount: (platformId: string, accountName: string, accessToken: string, profileInfo?: any) => void;
  onUpdateAccount: (accountId: string, updates: Partial<PlatformAccount>) => void;
  onRemoveAccount: (accountId: string) => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  accounts,
  onAddAccount,
  onUpdateAccount,
  onRemoveAccount
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [accountName, setAccountName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const [profilePreview, setProfilePreview] = useState<any>(null);

  const platformAccounts = accounts.filter(acc => acc.platformId === platform.id);

  const handleAddAccount = async () => {
    if (!accessToken.trim()) {
      alert('Please enter an access token');
      return;
    }

    if (!accountName.trim()) {
      alert('Please enter an account name');
      return;
    }

    setIsConnecting(true);
    setValidationStatus('validating');
    
    try {
      // Validate token with the API service
      const validation = await apiService.validateToken(platform, accessToken);
      
      if (validation.success) {
        setValidationStatus('valid');
        setValidationMessage(validation.message || 'Token validated successfully!');
        setProfilePreview(validation.data);
        
        // Add the account with profile information
        onAddAccount(platform.id, accountName, accessToken, validation.data);
        
        // Reset form
        setAccessToken('');
        setAccountName('');
        setShowAddForm(false);
        setValidationStatus('idle');
        setProfilePreview(null);
      } else {
        setValidationStatus('invalid');
        setValidationMessage(validation.message || 'Invalid token');
        setProfilePreview(null);
      }
    } catch (error) {
      setValidationStatus('invalid');
      setValidationMessage('Network error during validation');
      setProfilePreview(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleRemoveAccount = (accountId: string) => {
    if (confirm('Are you sure you want to remove this account?')) {
      onRemoveAccount(accountId);
    }
  };

  const handleEditAccountName = (accountId: string, newName: string) => {
    if (newName.trim()) {
      onUpdateAccount(accountId, { accountName: newName.trim() });
      setEditingAccount(null);
    }
  };

  const getPlatformIcon = () => {
    switch (platform.id) {
      case 'facebook': return '📘';
      case 'instagram': return '📷';
      case 'youtube': return '📺';
      case 'twitter': return '🐦';
      case 'linkedin': return '💼';
      case 'tiktok': return '🎵';
      default: return '🌐';
    }
  };

  const getApiVersion = () => {
    const versions = {
      facebook: 'v23.0',
      instagram: 'v23.0',
      youtube: 'v3',
      twitter: 'v2',
      linkedin: 'v2',
      tiktok: 'v1'
    };
    return versions[platform.id as keyof typeof versions] || 'v1';
  };

  const isLatestVersion = () => {
    return platform.id === 'facebook' || platform.id === 'instagram';
  };

  const getTokenType = () => {
    switch (platform.id) {
      case 'facebook': return 'Page Access Token';
      case 'instagram': return 'Instagram Access Token';
      case 'youtube': return 'OAuth 2.0 Token';
      case 'twitter': return 'Bearer Token';
      case 'linkedin': return 'OAuth 2.0 Token';
      default: return 'Access Token';
    }
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className={`h-2 bg-gradient-to-r ${platform.gradient}`}></div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getPlatformIcon()}</span>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {platform.name}
                <div className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isLatestVersion() 
                      ? 'bg-green-100 text-green-600 border border-green-200' 
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    API {getApiVersion()}
                  </span>
                  {isLatestVersion() && (
                    <Zap size={12} className="text-green-500" title="Latest API Version" />
                  )}
                </div>
              </h3>
              <p className={`text-sm flex items-center gap-1 ${platformAccounts.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                {platformAccounts.length > 0 ? (
                  <>
                    <CheckCircle size={12} />
                    {platformAccounts.length} account{platformAccounts.length !== 1 ? 's' : ''} connected
                  </>
                ) : (
                  'No accounts connected'
                )}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="p-2 text-green-400 hover:text-green-600 transition-colors"
            title="Add Account"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Connected Accounts List */}
        {platformAccounts.length > 0 && (
          <div className="space-y-3 mb-4">
            <h4 className="text-sm font-medium text-gray-700">Connected Accounts:</h4>
            {platformAccounts.map((account) => (
              <div
                key={account.id}
                className="bg-gray-50 rounded-lg p-3 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Profile Picture */}
                    {account.profileInfo?.profilePicture ? (
                      <img
                        src={account.profileInfo.profilePicture}
                        alt={account.accountName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={16} className="text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      {/* Account Name */}
                      <div className="flex items-center gap-2 mb-1">
                        {editingAccount === account.id ? (
                          <input
                            type="text"
                            defaultValue={account.accountName}
                            onBlur={(e) => handleEditAccountName(account.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleEditAccountName(account.id, e.currentTarget.value);
                              }
                              if (e.key === 'Escape') {
                                setEditingAccount(null);
                              }
                            }}
                            className="text-sm font-medium bg-white border border-blue-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1"
                            autoFocus
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {account.accountName}
                          </span>
                        )}
                        
                        {account.profileInfo?.verified && (
                          <div className="flex items-center gap-1 text-blue-500" title="Verified Account">
                            <CheckCircle size={12} />
                            <span className="text-xs">Verified</span>
                          </div>
                        )}
                      </div>

                      {/* Real Account Info */}
                      {account.profileInfo && (
                        <div className="space-y-1">
                          {account.profileInfo.displayName && account.profileInfo.displayName !== account.accountName && (
                            <div className="text-xs text-gray-600 font-medium">
                              {account.profileInfo.displayName}
                            </div>
                          )}
                          
                          {account.profileInfo.username && (
                            <div className="text-xs text-gray-500">
                              @{account.profileInfo.username}
                            </div>
                          )}

                          {(account.profileInfo.headline || account.profileInfo.description) && (
                            <div className="text-xs text-gray-500 truncate">
                              {account.profileInfo.headline || account.profileInfo.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => setEditingAccount(account.id)}
                      className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                      title="Edit name"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => handleRemoveAccount(account.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove account"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Account Stats */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {account.profileInfo?.followers !== undefined && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users size={10} />
                      <span>{formatFollowerCount(account.profileInfo.followers)} followers</span>
                    </div>
                  )}
                  
                  {account.profileInfo?.viewCount && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Eye size={10} />
                      <span>{formatFollowerCount(account.profileInfo.viewCount)} views</span>
                    </div>
                  )}
                  
                  {account.profileInfo?.mediaCount && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar size={10} />
                      <span>{account.profileInfo.mediaCount} posts</span>
                    </div>
                  )}
                  
                  {account.profileInfo?.videoCount && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar size={10} />
                      <span>{account.profileInfo.videoCount} videos</span>
                    </div>
                  )}

                  {account.lastPost && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar size={10} />
                      <span>Last: {new Date(account.lastPost).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1 text-gray-600">
                    <Plus size={10} />
                    <span>Added: {account.createdAt.toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Additional Info */}
                {(account.profileInfo?.category || account.profileInfo?.location || account.profileInfo?.website) && (
                  <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                    {account.profileInfo.category && (
                      <div className="text-xs text-gray-500">
                        📂 {account.profileInfo.category}
                      </div>
                    )}
                    
                    {account.profileInfo.location && (
                      <div className="text-xs text-gray-500">
                        📍 {account.profileInfo.location}
                      </div>
                    )}
                    
                    {account.profileInfo.website && (
                      <div className="text-xs text-gray-500">
                        <Globe size={10} className="inline mr-1" />
                        <a href={account.profileInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Account Form */}
        {showAddForm && (
          <div className="mt-4 space-y-3 border-t pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Name (Custom Label)
              </label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., My Business Page, Personal Account..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                This is just a label for you to identify the account
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {getTokenType()}
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value);
                  setValidationStatus('idle');
                  setValidationMessage('');
                  setProfilePreview(null);
                }}
                placeholder={`Enter ${getTokenType()}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              
              {/* Validation Status */}
              {validationStatus !== 'idle' && (
                <div className={`mt-2 text-xs flex items-center gap-1 ${
                  validationStatus === 'valid' ? 'text-green-600' : 
                  validationStatus === 'invalid' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {validationStatus === 'validating' && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-blue-500 border-t-transparent"></div>
                  )}
                  {validationStatus === 'valid' && <CheckCircle size={12} />}
                  {validationStatus === 'invalid' && <AlertCircle size={12} />}
                  {validationMessage}
                </div>
              )}

              {/* Profile Preview */}
              {profilePreview && validationStatus === 'valid' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    {profilePreview.profilePicture ? (
                      <img
                        src={profilePreview.profilePicture}
                        alt={profilePreview.displayName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-green-300"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
                        <User size={16} className="text-green-600" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-800 truncate">
                          {profilePreview.displayName}
                        </span>
                        {profilePreview.verified && (
                          <CheckCircle size={12} className="text-blue-500" title="Verified" />
                        )}
                      </div>
                      
                      {profilePreview.username && (
                        <div className="text-xs text-green-600">
                          @{profilePreview.username}
                        </div>
                      )}
                      
                      {profilePreview.followers !== undefined && (
                        <div className="text-xs text-green-600">
                          {formatFollowerCount(profilePreview.followers)} followers
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-green-700">
                    ✅ This account will be connected as "{accountName}"
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleAddAccount}
                disabled={isConnecting || !accessToken.trim() || !accountName.trim()}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Validating...
                  </>
                ) : (
                  'Add Account'
                )}
              </button>
              
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setValidationStatus('idle');
                  setValidationMessage('');
                  setAccessToken('');
                  setAccountName('');
                  setProfilePreview(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            <div className="text-xs text-gray-500 space-y-1">
              <p>Get your {getTokenType()} from:</p>
              <a 
                href={getTokenUrl(platform.id)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                {platform.name} Developer Console
              </a>
              
              {/* API Version Info */}
              <div className={`mt-2 p-2 rounded ${
                isLatestVersion() ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'
              }`}>
                <div className="font-medium flex items-center gap-1">
                  API Version: {getApiVersion()}
                  {isLatestVersion() && <Zap size={12} />}
                </div>
                <div className="text-xs mt-1">
                  {isLatestVersion() 
                    ? `Using the latest ${platform.name} API with enhanced features`
                    : `Using stable ${platform.name} API with reliable functionality`
                  }
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Latest API Features Badge */}
        {isLatestVersion() && platformAccounts.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-2">
            <div className="flex items-center gap-1 text-green-700 text-xs font-medium mb-1">
              <Zap size={12} />
              Latest API Features
            </div>
            <div className="text-xs text-green-600">
              Enhanced media uploads, better error handling, and improved performance
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getTokenUrl = (platformId: string): string => {
  const urls = {
    facebook: 'https://developers.facebook.com/tools/explorer/',
    instagram: 'https://developers.facebook.com/docs/instagram-basic-display-api/getting-started',
    youtube: 'https://console.developers.google.com/',
    twitter: 'https://developer.twitter.com/en/portal/dashboard',
    linkedin: 'https://www.linkedin.com/developers/apps',
    tiktok: 'https://developers.tiktok.com/'
  };
  
  return urls[platformId as keyof typeof urls] || '#';
};