import React from 'react';
import { PostComposer } from '../components/PostComposer';
import { PostHistory } from '../components/PostHistory';
import { SchedulerStatus } from '../components/SchedulerStatus';
import { PlatformAccount, Post } from '../types/platform';

interface PostsPageProps {
  accounts: PlatformAccount[];
  posts: Post[];
  isSchedulerActive: boolean;
  onCreatePost: (post: Omit<Post, 'id' | 'createdAt'>) => void;
  onDeletePost: (postId: string) => void;
}

export const PostsPage: React.FC<PostsPageProps> = ({
  accounts,
  posts,
  isSchedulerActive,
  onCreatePost,
  onDeletePost
}) => {
  const connectedAccounts = accounts.filter(acc => acc.connected);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Manage All Your Social Media Posts
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Create engaging content, upload videos and images, and schedule posts across all your 
          connected social media accounts with our unified posting dashboard.
        </p>
      </div>

      {/* Auto Scheduler Status */}
      <section className="mb-8">
        <SchedulerStatus 
          posts={posts}
          isSchedulerActive={isSchedulerActive}
        />
      </section>

      {/* Post Composer - Full Width Row */}
      <section className="mb-8">
        <PostComposer
          accounts={accounts}
          onCreatePost={onCreatePost}
        />
      </section>

      {/* Post History - Full Width Row with Scroll */}
      <section className="mb-8">
        <PostHistory
          posts={posts}
          onDeletePost={onDeletePost}
        />
      </section>

      {/* Enhanced Features Section */}
      <section className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Enhanced Multi-Account Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <h4 className="font-semibold mb-2">Multiple Accounts</h4>
            <p className="text-sm text-gray-600">
              Connect multiple accounts per platform with custom names and management
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🎯</span>
            </div>
            <h4 className="font-semibold mb-2">Selective Posting</h4>
            <p className="text-sm text-gray-600">
              Choose specific accounts for each post with account-level targeting
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">⚡</span>
            </div>
            <h4 className="font-semibold mb-2">Auto Scheduler</h4>
            <p className="text-sm text-gray-600">
              Automatically posts your scheduled content to all selected accounts
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-yellow-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">🤖</span>
            </div>
            <h4 className="font-semibold mb-2">AI Content Generation</h4>
            <p className="text-sm text-gray-600">
              Generate engaging content using Gemini AI with custom prompts
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      {connectedAccounts.length === 0 && (
        <section className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Get Started</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔗</span>
              </div>
              <h4 className="font-semibold mb-2">1. Connect Accounts</h4>
              <p className="text-sm text-gray-600">
                Go to Accounts page to connect your social media platforms
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✍️</span>
              </div>
              <h4 className="font-semibold mb-2">2. Create Content</h4>
              <p className="text-sm text-gray-600">
                Write posts, upload media, or use AI to generate engaging content
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🚀</span>
              </div>
              <h4 className="font-semibold mb-2">3. Post & Schedule</h4>
              <p className="text-sm text-gray-600">
                Publish immediately or schedule posts across all your accounts
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
};