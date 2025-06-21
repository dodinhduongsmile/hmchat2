import { useState, useEffect } from 'react';
import { Post } from '../types/platform';

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('scheduledPosts');
    return saved ? JSON.parse(saved).map((post: any) => ({
      ...post,
      createdAt: new Date(post.createdAt),
      scheduledTime: post.scheduledTime ? new Date(post.scheduledTime) : undefined
    })) : [];
  });

  useEffect(() => {
    localStorage.setItem('scheduledPosts', JSON.stringify(posts));
  }, [posts]);

  const addPost = (post: Omit<Post, 'id' | 'createdAt'>) => {
    const newPost: Post = {
      ...post,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  };

  const updatePost = (postId: string, updates: Partial<Post>) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === postId 
          ? { ...post, ...updates }
          : post
      )
    );
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
  };

  return {
    posts,
    addPost,
    updatePost,
    deletePost
  };
};