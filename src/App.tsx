import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { SolutionPage } from './pages/SolutionPage';
import { PostsPage } from './pages/PostsPage';
import { AccountsPage } from './pages/AccountsPage';
import { PricingPage } from './pages/PricingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { usePlatforms } from './hooks/usePlatforms';
import { usePosts } from './hooks/usePosts';
import { useScheduler } from './hooks/useScheduler';
import { useAuth } from './hooks/useAuth';
import { apiService } from './services/apiService';
import { validateMediaForPlatform } from './utils/mediaUtils';

function App() {
  const { platforms, accounts, addAccount, updateAccount, removeAccount, getAccountsByPlatform } = usePlatforms();
  const { posts, addPost, deletePost, updatePost } = usePosts();
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize auto scheduler
  const { isSchedulerActive } = useScheduler({ posts, updatePost });

  const connectedAccounts = accounts.filter(acc => acc.connected);

  const handleCreatePost = async (postData: any) => {
    const post = addPost(postData);
    
    // If it's not scheduled, post immediately
    if (!post.scheduledTime) {
      updatePost(post.id, { status: 'posting' });
      
      // Filter accounts based on media compatibility
      const compatibleAccounts = post.platforms.filter(account => {
        if (!post.media || post.media.length === 0) return true;
        const errors = validateMediaForPlatform(post.media, account.platformId);
        return errors.length === 0;
      });

      if (compatibleAccounts.length === 0) {
        updatePost(post.id, { 
          status: 'failed',
          error: 'No compatible accounts for media files'
        });
        return;
      }

      const results = await Promise.allSettled(
        compatibleAccounts.map(account => 
          apiService.postToPlatform(account, post.content, post.media)
        )
      );

      const allSuccessful = results.every(result => 
        result.status === 'fulfilled' && result.value.success
      );

      // Collect post URLs and errors
      const postUrls: { [key: string]: string } = {};
      const errors: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          if (result.value.success && result.value.data?.url) {
            postUrls[compatibleAccounts[index].id] = result.value.data.url;
          } else {
            errors.push(`${compatibleAccounts[index].accountName}: ${result.value.message}`);
          }
        } else {
          errors.push(`${compatibleAccounts[index].accountName}: Network error`);
        }
      });

      updatePost(post.id, { 
        status: allSuccessful ? 'posted' : 'failed',
        postUrls: Object.keys(postUrls).length > 0 ? postUrls : undefined,
        error: errors.length > 0 ? errors.join('; ') : undefined,
        postedAt: new Date()
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        connectedCount={connectedAccounts.length}
        totalPosts={posts.length}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/solution" element={<SolutionPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Protected routes */}
        <Route 
          path="/posts" 
          element={
            <ProtectedRoute>
              <PostsPage
                accounts={accounts}
                posts={posts}
                isSchedulerActive={isSchedulerActive}
                onCreatePost={handleCreatePost}
                onDeletePost={deletePost}
              />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/accounts" 
          element={
            <ProtectedRoute>
              <AccountsPage
                platforms={platforms}
                accounts={accounts}
                onAddAccount={addAccount}
                onUpdateAccount={updateAccount}
                onRemoveAccount={removeAccount}
                getAccountsByPlatform={getAccountsByPlatform}
              />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;