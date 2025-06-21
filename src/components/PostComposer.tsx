import React, { useState, useRef, useEffect } from 'react';
import { PlatformAccount, Post, MediaFile } from '../types/platform';
import { Send, Calendar, X, AlertTriangle, CheckSquare, Square } from 'lucide-react';
import { MediaUploader } from './MediaUploader';
import { PlatformMediaValidator } from './PlatformMediaValidator';
import { AIContentGenerator } from './AIContentGenerator';
import { HashtagManager } from './HashtagManager';
import { validateMediaForPlatform } from '../utils/mediaUtils';

interface PostComposerProps {
  accounts: PlatformAccount[];
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({
  accounts,
  onCreatePost
}) => {
  const [content, setContent] = useState('');
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [lastGeneratedContent, setLastGeneratedContent] = useState('');
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<PlatformAccount[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const connectedAccounts = accounts.filter(acc => acc.connected);

  // Update content display with hashtags
  const getDisplayContent = () => {
    let displayContent = content;
    
    if (selectedHashtags.length > 0) {
      const hashtagString = selectedHashtags.map(tag => `#${tag}`).join(' ');
      
      if (displayContent.trim()) {
        displayContent += '\n\n' + hashtagString;
      } else {
        displayContent = hashtagString;
      }
    }
    
    return displayContent;
  };

  // Auto-resize textarea when content or hashtags change
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on content
      const newHeight = Math.max(120, textarea.scrollHeight);
      textarea.style.height = `${newHeight}px`;
    }
  }, [content, selectedHashtags]); // Add selectedHashtags as dependency

  const handleAccountToggle = (account: PlatformAccount) => {
    setSelectedAccounts(prev => 
      prev.find(acc => acc.id === account.id)
        ? prev.filter(acc => acc.id !== account.id)
        : [...prev, account]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === connectedAccounts.length) {
      // Deselect all
      setSelectedAccounts([]);
    } else {
      // Select all
      setSelectedAccounts([...connectedAccounts]);
    }
  };

  const handleAIContentGenerated = (generatedContent: string) => {
    setContent(generatedContent);
  };

  const handleHashtagsChange = (hashtags: string[]) => {
    setSelectedHashtags(hashtags);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const hashtagString = selectedHashtags.length > 0 ? '\n\n' + selectedHashtags.map(tag => `#${tag}`).join(' ') : '';
    
    if (newValue.endsWith(hashtagString)) {
      // User is editing the main content
      setContent(newValue.replace(hashtagString, ''));
    } else {
      // User might be editing hashtags area, preserve main content
      const lines = newValue.split('\n');
      const contentLines = [];
      let foundHashtagSection = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#') && !foundHashtagSection) {
          foundHashtagSection = true;
          break;
        }
        if (!foundHashtagSection) {
          contentLines.push(line);
        }
      }
      
      setContent(contentLines.join('\n').trim());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalContent = getDisplayContent();
    
    if (!finalContent.trim() && media.length === 0) {
      alert('Please enter some content or add media');
      return;
    }

    if (selectedAccounts.length === 0) {
      alert('Please select at least one account');
      return;
    }

    // Validate media for selected accounts
    const accountsWithErrors = selectedAccounts.filter(account => {
      const errors = validateMediaForPlatform(media, account.platformId);
      return errors.length > 0;
    });

    if (accountsWithErrors.length > 0) {
      const proceed = confirm(
        `Some media files are not compatible with ${accountsWithErrors.map(acc => acc.accountName).join(', ')}. ` +
        'These accounts will be skipped. Do you want to continue?'
      );
      if (!proceed) return;
    }

    setIsComposing(true);

    const post: Omit<Post, 'id' | 'createdAt'> = {
      content: finalContent,
      media: media.length > 0 ? media : undefined,
      platforms: selectedAccounts,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : undefined,
      status: scheduledTime ? 'scheduled' : 'draft'
    };

    onCreatePost(post);

    // Reset form
    setContent('');
    setSelectedHashtags([]);
    setLastGeneratedContent('');
    setMedia([]);
    setSelectedAccounts([]);
    setScheduledTime('');
    setIsComposing(false);
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  const clearForm = () => {
    setContent('');
    setSelectedHashtags([]);
    setLastGeneratedContent('');
    setMedia([]);
    setSelectedAccounts([]);
    setScheduledTime('');
  };

  // Group accounts by platform
  const accountsByPlatform = connectedAccounts.reduce((acc, account) => {
    if (!acc[account.platformId]) {
      acc[account.platformId] = [];
    }
    acc[account.platformId].push(account);
    return acc;
  }, {} as Record<string, PlatformAccount[]>);

  const getPlatformIcon = (platformId: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      youtube: '📺',
      twitter: '🐦',
      linkedin: '💼',
      tiktok: '🎵'
    };
    return icons[platformId as keyof typeof icons] || '🌐';
  };

  const formatFollowerCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const isAllSelected = selectedAccounts.length === connectedAccounts.length && connectedAccounts.length > 0;
  const isSomeSelected = selectedAccounts.length > 0 && selectedAccounts.length < connectedAccounts.length;

  // Calculate final content length with hashtags
  const finalContentLength = getDisplayContent().length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
        <Send size={20} className="text-blue-600" />
        Create New Post
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Content & Media */}
          <div className="space-y-6">
            {/* Content with Auto-expanding Textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Post Content
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={getDisplayContent()}
                  onChange={handleContentChange}
                  placeholder="What's on your mind? Share your thoughts across all your social platforms..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden min-h-[120px] max-h-[500px] transition-all duration-200"
                />
                {selectedHashtags.length > 0 && (
                  <div className="absolute bottom-3 right-3 bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                    {selectedHashtags.length} hashtag{selectedHashtags.length !== 1 ? 's' : ''} added
                  </div>
                )}
              </div>
              <div className="mt-1 text-xs text-gray-500 text-right">
                {finalContentLength}/2200 characters
                {selectedHashtags.length > 0 && (
                  <span className="ml-2 text-blue-600">
                    (includes {selectedHashtags.length} hashtag{selectedHashtags.length !== 1 ? 's' : ''})
                  </span>
                )}
              </div>
            </div>

            {/* Hashtag Manager */}
            <HashtagManager
              content={content}
              onHashtagsChange={handleHashtagsChange}
              lastGeneratedContent={lastGeneratedContent}
              onLastGeneratedContentChange={setLastGeneratedContent}
            />

            {/* AI Content Generator */}
            <AIContentGenerator onContentGenerated={handleAIContentGenerated} />

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Media Files (Images & Videos)
              </label>
              <MediaUploader
                media={media}
                onMediaChange={setMedia}
                maxFiles={10}
              />
            </div>
          </div>

          {/* Right Column - Account Selection, Schedule & Actions */}
          <div className="space-y-6">
            {/* Account Selection - Grid Layout */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Accounts ({selectedAccounts.length} selected)
                </label>
                
                {/* Select All Button */}
                {connectedAccounts.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      isAllSelected 
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                        : isSomeSelected
                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {isAllSelected ? (
                      <CheckSquare size={12} />
                    ) : isSomeSelected ? (
                      <div className="w-3 h-3 bg-blue-600 rounded-sm flex items-center justify-center">
                        <div className="w-1.5 h-0.5 bg-white rounded"></div>
                      </div>
                    ) : (
                      <Square size={12} />
                    )}
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>
              
              {connectedAccounts.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="font-medium">No accounts connected</p>
                  <p className="text-sm mt-1">Connect your social media accounts above to start posting.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {Object.entries(accountsByPlatform).map(([platformId, platformAccounts]) => (
                    <div key={platformId} className="border border-gray-200 rounded-lg p-3">
                      {/* Platform Header - Compact */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-base">{getPlatformIcon(platformId)}</span>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {platformAccounts[0].platformName}
                        </h4>
                        <span className="text-xs text-gray-500">
                          ({platformAccounts.length} account{platformAccounts.length !== 1 ? 's' : ''})
                        </span>
                      </div>
                      
                      {/* Accounts Grid - 3 columns */}
                      <div className="grid grid-cols-3 gap-2">
                        {platformAccounts.map((account) => (
                          <button
                            key={account.id}
                            type="button"
                            onClick={() => handleAccountToggle(account)}
                            className={`p-2 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-sm ${
                              selectedAccounts.find(acc => acc.id === account.id)
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col items-center text-center space-y-1">
                              {/* Avatar */}
                              {account.profileInfo?.profilePicture ? (
                                <img
                                  src={account.profileInfo.profilePicture}
                                  alt={account.accountName}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-sm">👤</span>
                                </div>
                              )}
                              
                              {/* Account Name */}
                              <div className="w-full">
                                <div className="flex items-center justify-center gap-1">
                                  <div className="font-medium text-xs text-gray-900 truncate max-w-full">
                                    {account.accountName}
                                  </div>
                                  {account.profileInfo?.verified && (
                                    <div className="text-blue-500 text-xs flex-shrink-0" title="Verified">
                                      ✓
                                    </div>
                                  )}
                                </div>
                                
                                {/* Username */}
                                {account.profileInfo?.username && (
                                  <div className="text-xs text-gray-500 truncate">
                                    @{account.profileInfo.username}
                                  </div>
                                )}
                                
                                {/* Followers */}
                                {account.profileInfo?.followers !== undefined && (
                                  <div className="text-xs text-gray-500">
                                    {formatFollowerCount(account.profileInfo.followers)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <Calendar size={16} />
                Schedule (optional)
              </label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                min={getMinDateTime()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {scheduledTime && (
                <p className="mt-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-2">
                  📅 Post will be published on {new Date(scheduledTime).toLocaleString()}
                </p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={isComposing || (!content.trim() && selectedHashtags.length === 0 && media.length === 0) || selectedAccounts.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-medium hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isComposing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    {scheduledTime ? 'Scheduling...' : 'Posting...'}
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    {scheduledTime ? 'Schedule Post' : 'Post Now'}
                  </>
                )}
              </button>
              
              {(content || selectedHashtags.length > 0 || media.length > 0 || selectedAccounts.length > 0 || scheduledTime) && (
                <button
                  type="button"
                  onClick={clearForm}
                  className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
                >
                  <X size={16} />
                  Clear Form
                </button>
              )}
            </div>

            {/* Compact Quick Stats */}
            {selectedAccounts.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Posting Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>Accounts:</span>
                    <span className="font-medium">{selectedAccounts.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Reach:</span>
                    <span className="font-medium">
                      {formatFollowerCount(selectedAccounts.reduce((total, acc) => total + (acc.profileInfo?.followers || 0), 0))}
                    </span>
                  </div>
                  {media.length > 0 && (
                    <div className="flex justify-between">
                      <span>Media:</span>
                      <span className="font-medium">{media.length}</span>
                    </div>
                  )}
                  {selectedHashtags.length > 0 && (
                    <div className="flex justify-between">
                      <span>Hashtags:</span>
                      <span className="font-medium">{selectedHashtags.length}</span>
                    </div>
                  )}
                  {scheduledTime && (
                    <div className="flex justify-between col-span-2">
                      <span>Scheduled:</span>
                      <span className="font-medium text-blue-600">
                        {new Date(scheduledTime).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media Validation - Full Width Below */}
        {media.length > 0 && selectedAccounts.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <PlatformMediaValidator
              media={media}
              selectedPlatforms={selectedAccounts}
            />
          </div>
        )}
      </form>
    </div>
  );
};