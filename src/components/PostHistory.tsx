import React from 'react';
import { Post } from '../types/platform';
import { Clock, CheckCircle, XCircle, Calendar, ExternalLink, Image as ImageIcon, Film, Play, AlertTriangle, User } from 'lucide-react';
import { formatFileSize, formatDuration } from '../utils/mediaUtils';

interface PostHistoryProps {
  posts: Post[];
  onDeletePost: (postId: string) => void;
}

export const PostHistory: React.FC<PostHistoryProps> = ({
  posts,
  onDeletePost
}) => {
  const getStatusIcon = (status: Post['status']) => {
    switch (status) {
      case 'posted':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'scheduled':
        return <Clock className="text-blue-500" size={16} />;
      case 'failed':
        return <XCircle className="text-red-500" size={16} />;
      case 'posting':
        return <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />;
      default:
        return <Calendar className="text-gray-500" size={16} />;
    }
  };

  const getStatusText = (status: Post['status']) => {
    switch (status) {
      case 'posted':
        return 'Posted';
      case 'scheduled':
        return 'Scheduled';
      case 'failed':
        return 'Failed';
      case 'posting':
        return 'Posting...';
      default:
        return 'Draft';
    }
  };

  const getStatusColor = (status: Post['status']) => {
    switch (status) {
      case 'posted':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'scheduled':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'posting':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const isOverdue = (post: Post) => {
    return post.status === 'scheduled' && 
           post.scheduledTime && 
           post.scheduledTime < new Date();
  };

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

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No posts yet</h3>
          <p>Your posted and scheduled content will appear here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar size={20} className="text-blue-600" />
          Post History ({posts.length})
        </h2>
      </div>

      {/* Scrollable Content */}
      <div className="max-h-[600px] overflow-y-auto">
        <div className="p-6 space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className={`border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
                isOverdue(post) ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-white'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(post.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(post.status)}`}>
                    {getStatusText(post.status)}
                  </span>
                  {isOverdue(post) && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium text-orange-600 bg-orange-100 border border-orange-200 flex items-center gap-1">
                      <AlertTriangle size={12} />
                      Overdue
                    </span>
                  )}
                </div>
                
                <button
                  onClick={() => onDeletePost(post.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  title="Delete post"
                >
                  <XCircle size={16} />
                </button>
              </div>

              {/* Content Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Content */}
                <div className="lg:col-span-2">
                  {post.content && (
                    <p className="text-gray-900 text-sm leading-relaxed line-clamp-3">
                      {post.content}
                    </p>
                  )}
                </div>

                {/* Media Preview - Compact */}
                {post.media && post.media.length > 0 && (
                  <div className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon size={14} className="text-gray-500" />
                      <span className="text-xs text-gray-600 font-medium">
                        {post.media.length} file{post.media.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto">
                      {post.media.slice(0, 3).map((mediaFile, index) => (
                        <div
                          key={mediaFile.id}
                          className="relative flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden group"
                        >
                          {mediaFile.type === 'image' ? (
                            <img
                              src={mediaFile.url}
                              alt={mediaFile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="relative w-full h-full">
                              {mediaFile.thumbnail ? (
                                <img
                                  src={mediaFile.thumbnail}
                                  alt={mediaFile.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <Film className="text-gray-400" size={16} />
                                </div>
                              )}
                              
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                                <div className="bg-white bg-opacity-90 rounded-full p-1">
                                  <Play className="text-gray-800" size={8} />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Show count overlay for additional files */}
                          {index === 2 && post.media!.length > 3 && (
                            <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                              <span className="text-white font-medium text-xs">
                                +{post.media!.length - 3}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {post.error && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-500 flex-shrink-0 mt-0.5" size={14} />
                    <div>
                      <h4 className="text-sm font-medium text-red-800 mb-1">Error:</h4>
                      <p className="text-sm text-red-700">{post.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Post URLs */}
              {post.postUrls && Object.keys(post.postUrls).length > 0 && (
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                    <ExternalLink size={12} />
                    Post Links:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(post.postUrls).map(([accountId, url]) => {
                      const account = post.platforms.find(acc => acc.id === accountId);
                      return (
                        <a
                          key={accountId}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 hover:underline text-xs bg-white px-2 py-1 rounded border border-green-300"
                        >
                          <ExternalLink size={10} />
                          {account?.accountName || 'Unknown Account'}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Row - Compact Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-4">
                  <span>
                    Created: {post.createdAt.toLocaleDateString()}
                  </span>
                  {post.scheduledTime && (
                    <span className={isOverdue(post) ? 'text-orange-600 font-medium' : ''}>
                      {post.status === 'scheduled' ? 'Scheduled: ' : 'Posted: '}
                      {post.scheduledTime.toLocaleString()}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <span>Accounts ({post.platforms.length}):</span>
                  <div className="flex gap-1">
                    {post.platforms.slice(0, 4).map((account) => (
                      <span
                        key={account.id}
                        className="text-sm"
                        title={`${account.accountName} (${account.platformName})`}
                      >
                        {getPlatformIcon(account.platformId)}
                      </span>
                    ))}
                    {post.platforms.length > 4 && (
                      <span className="text-xs text-gray-400">
                        +{post.platforms.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Details - Collapsible */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex flex-wrap gap-2">
                  {post.platforms.map((account) => (
                    <div
                      key={account.id}
                      className="inline-flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs border border-gray-200"
                    >
                      <span>{getPlatformIcon(account.platformId)}</span>
                      <span className="truncate max-w-[120px]">{account.accountName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};