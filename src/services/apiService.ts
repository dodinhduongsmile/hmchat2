import { PlatformAccount, ApiResponse, MediaFile } from '../types/platform';

class ApiService {
  // Facebook Graph API v23.0 - Page Posting Only (Latest Version)
  async postToFacebook(accessToken: string, content: string, media?: MediaFile[]): Promise<ApiResponse> {
    try {
      const apiVersion = 'v23.0'; // Latest version as of 2024
      
      // Note: Facebook API only supports posting to Pages, not personal profiles
      // Users need a Page Access Token, not a User Access Token
      
      if (media && media.length > 0) {
        // Handle media posts to Facebook Page
        if (media.length === 1) {
          // Single media post to Page
          const mediaFile = media[0];
          const endpoint = mediaFile.type === 'video' 
            ? `https://graph.facebook.com/${apiVersion}/me/videos`
            : `https://graph.facebook.com/${apiVersion}/me/photos`;

          const formData = new FormData();
          formData.append('source', mediaFile.file);
          formData.append('message', content);
          formData.append('access_token', accessToken);
          
          // Enhanced video parameters for v23.0 Page posting
          if (mediaFile.type === 'video') {
            formData.append('published', 'true');
            formData.append('privacy', JSON.stringify({ value: 'EVERYONE' }));
            // Page-specific targeting options
            formData.append('targeting', JSON.stringify({ 
              geo_locations: { countries: ['US', 'GB', 'CA', 'AU'] },
              age_min: 18,
              age_max: 65
            }));
          }

          const response = await fetch(endpoint, {
            method: 'POST',
            body: formData
          });

          const data = await response.json();
          
          if (response.ok) {
            return { 
              success: true, 
              message: 'Posted to Facebook Page successfully', 
              data: { 
                ...data, 
                url: `https://facebook.com/${data.id}`,
                platform: 'facebook',
                apiVersion,
                postType: 'page_post'
              }
            };
          } else {
            // Enhanced error handling for Page posting
            let errorMessage = data.error?.message || 'Failed to post to Facebook Page';
            
            if (data.error?.code === 200) {
              errorMessage = 'Permission denied. Make sure you have a Page Access Token with publish_pages permission.';
            } else if (data.error?.code === 190) {
              errorMessage = 'Invalid access token. Please get a new Page Access Token.';
            } else if (data.error?.code === 100) {
              errorMessage = 'Invalid parameter. Check your Page ID and permissions.';
            }
            
            return { 
              success: false, 
              message: errorMessage,
              errorCode: data.error?.code,
              errorType: data.error?.type,
              hint: 'Facebook only allows posting to Pages via API. Get a Page Access Token from Facebook Developer Console.'
            };
          }
        } else {
          // Multiple media - create album on Facebook Page
          const albumResponse = await fetch(`https://graph.facebook.com/${apiVersion}/me/albums`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              name: content.substring(0, 50) || 'Social Media Post',
              message: content,
              privacy: JSON.stringify({ value: 'EVERYONE' }),
              access_token: accessToken
            })
          });

          const albumData = await albumResponse.json();
          if (!albumResponse.ok) {
            let errorMessage = albumData.error?.message || 'Failed to create album on Facebook Page';
            
            if (albumData.error?.code === 200) {
              errorMessage = 'Permission denied. Make sure you have a Page Access Token with publish_pages permission.';
            }
            
            return { 
              success: false, 
              message: errorMessage,
              errorCode: albumData.error?.code,
              hint: 'Facebook only allows posting to Pages via API. Get a Page Access Token from Facebook Developer Console.'
            };
          }

          // Upload media to Page album with enhanced error handling
          const uploadPromises = media.map(async (mediaFile, index) => {
            const endpoint = mediaFile.type === 'video' 
              ? `https://graph.facebook.com/${apiVersion}/${albumData.id}/videos`
              : `https://graph.facebook.com/${apiVersion}/${albumData.id}/photos`;

            const formData = new FormData();
            formData.append('source', mediaFile.file);
            formData.append('access_token', accessToken);
            
            // Add caption for first media item
            if (index === 0 && content) {
              formData.append(mediaFile.type === 'video' ? 'description' : 'message', content);
            }

            try {
              const response = await fetch(endpoint, {
                method: 'POST',
                body: formData
              });
              return { response, index, mediaFile };
            } catch (error) {
              return { error, index, mediaFile };
            }
          });

          const results = await Promise.allSettled(uploadPromises);
          const successfulUploads = results.filter(result => 
            result.status === 'fulfilled' && 
            result.value.response && 
            result.value.response.ok
          );

          if (successfulUploads.length > 0) {
            return { 
              success: true, 
              message: `Posted ${successfulUploads.length}/${media.length} media files to Facebook Page album`,
              data: { 
                id: albumData.id, 
                url: `https://facebook.com/media/set/?set=a.${albumData.id}`,
                successCount: successfulUploads.length,
                totalCount: media.length,
                platform: 'facebook',
                apiVersion,
                postType: 'page_album'
              }
            };
          } else {
            return { 
              success: false, 
              message: 'All media failed to upload to Facebook Page album',
              hint: 'Check your Page permissions and media file formats.'
            };
          }
        }
      } else {
        // Text-only post to Facebook Page
        const endpoint = `https://graph.facebook.com/${apiVersion}/me/feed`;
        const params = new URLSearchParams({
          message: content,
          privacy: JSON.stringify({ value: 'EVERYONE' }),
          access_token: accessToken
        });

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        });

        const data = await response.json();
        
        if (response.ok) {
          return { 
            success: true, 
            message: 'Posted to Facebook Page successfully', 
            data: { 
              ...data, 
              url: `https://facebook.com/${data.id}`,
              platform: 'facebook',
              apiVersion,
              postType: 'page_text'
            }
          };
        } else {
          let errorMessage = data.error?.message || 'Failed to post to Facebook Page';
          
          if (data.error?.code === 200) {
            errorMessage = 'Permission denied. Make sure you have a Page Access Token with publish_pages permission.';
          } else if (data.error?.code === 190) {
            errorMessage = 'Invalid access token. Please get a new Page Access Token.';
          }
          
          return { 
            success: false, 
            message: errorMessage,
            errorCode: data.error?.code,
            errorType: data.error?.type,
            hint: 'Facebook only allows posting to Pages via API. Get a Page Access Token from Facebook Developer Console.'
          };
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error posting to Facebook Page',
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check your internet connection and try again.'
      };
    }
  }

  // Instagram Basic Display API with latest features
  async postToInstagram(accessToken: string, content: string, media?: MediaFile[]): Promise<ApiResponse> {
    try {
      const apiVersion = 'v23.0'; // Updated to match Facebook API version
      
      if (!media || media.length === 0) {
        return { success: false, message: 'Instagram requires at least one image or video' };
      }

      if (media.length === 1) {
        // Single media post with enhanced features
        const mediaFile = media[0];
        const mediaEndpoint = `https://graph.instagram.com/${apiVersion}/me/media`;
        
        const mediaParams = new URLSearchParams({
          access_token: accessToken,
          caption: content
        });

        // Use different parameters based on media type
        if (mediaFile.type === 'image') {
          mediaParams.append('image_url', mediaFile.url);
        } else {
          mediaParams.append('video_url', mediaFile.url);
          mediaParams.append('media_type', 'VIDEO');
          
          // Add video-specific parameters for v23.0
          if (mediaFile.thumbnail) {
            mediaParams.append('thumb_offset', '1000'); // 1 second
          }
          mediaParams.append('video_start_time_ms', '0');
        }

        const mediaResponse = await fetch(mediaEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: mediaParams
        });

        const mediaData = await mediaResponse.json();
        
        if (!mediaResponse.ok) {
          return { 
            success: false, 
            message: mediaData.error?.message || 'Failed to create Instagram media',
            errorCode: mediaData.error?.code
          };
        }

        // Publish the media with v23.0 features
        const publishEndpoint = `https://graph.instagram.com/${apiVersion}/me/media_publish`;
        const publishParams = new URLSearchParams({
          creation_id: mediaData.id,
          access_token: accessToken
        });

        const publishResponse = await fetch(publishEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: publishParams
        });

        const publishData = await publishResponse.json();

        if (publishResponse.ok) {
          return { 
            success: true, 
            message: 'Posted to Instagram successfully', 
            data: { 
              ...publishData, 
              url: `https://instagram.com/p/${publishData.id}`,
              platform: 'instagram',
              apiVersion
            }
          };
        } else {
          return { 
            success: false, 
            message: publishData.error?.message || 'Failed to publish to Instagram',
            errorCode: publishData.error?.code
          };
        }
      } else {
        // Carousel post with enhanced v23.0 features
        const carouselItems = await Promise.allSettled(
          media.map(async (mediaFile) => {
            const mediaParams = new URLSearchParams({
              access_token: accessToken,
              is_carousel_item: 'true'
            });

            if (mediaFile.type === 'image') {
              mediaParams.append('image_url', mediaFile.url);
            } else {
              mediaParams.append('video_url', mediaFile.url);
              mediaParams.append('media_type', 'VIDEO');
            }

            const response = await fetch(`https://graph.instagram.com/${apiVersion}/me/media`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: mediaParams
            });

            const data = await response.json();
            return response.ok ? data.id : null;
          })
        );

        const validItems = carouselItems
          .filter(result => result.status === 'fulfilled' && result.value !== null)
          .map(result => (result as PromiseFulfilledResult<string>).value);

        if (validItems.length === 0) {
          return { success: false, message: 'Failed to create carousel items' };
        }

        // Create carousel container with v23.0 features
        const carouselParams = new URLSearchParams({
          media_type: 'CAROUSEL',
          children: validItems.join(','),
          caption: content,
          access_token: accessToken
        });

        const carouselResponse = await fetch(`https://graph.instagram.com/${apiVersion}/me/media`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: carouselParams
        });

        const carouselData = await carouselResponse.json();
        
        if (!carouselResponse.ok) {
          return { 
            success: false, 
            message: carouselData.error?.message || 'Failed to create carousel',
            errorCode: carouselData.error?.code
          };
        }

        // Publish carousel
        const publishParams = new URLSearchParams({
          creation_id: carouselData.id,
          access_token: accessToken
        });

        const publishResponse = await fetch(`https://graph.instagram.com/${apiVersion}/me/media_publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: publishParams
        });

        const publishData = await publishResponse.json();

        if (publishResponse.ok) {
          return { 
            success: true, 
            message: `Posted carousel with ${validItems.length}/${media.length} items to Instagram`,
            data: { 
              ...publishData, 
              url: `https://instagram.com/p/${publishData.id}`,
              successCount: validItems.length,
              totalCount: media.length,
              platform: 'instagram',
              apiVersion
            }
          };
        } else {
          return { 
            success: false, 
            message: publishData.error?.message || 'Failed to publish carousel',
            errorCode: publishData.error?.code
          };
        }
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error posting to Instagram',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // YouTube Data API v3 with enhanced video upload
  async postToYouTube(accessToken: string, title: string, description: string, media?: MediaFile[]): Promise<ApiResponse> {
    try {
      const videoFile = media?.find(m => m.type === 'video');
      
      if (!videoFile) {
        return { success: false, message: 'YouTube requires a video file' };
      }

      // Enhanced metadata with v3 features
      const metadata = {
        snippet: {
          title: title || 'Untitled Video',
          description: description,
          categoryId: '22', // People & Blogs
          tags: ['social media', 'auto post', 'content creation'],
          defaultLanguage: 'en',
          defaultAudioLanguage: 'en'
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
          madeForKids: false
        }
      };

      // Step 1: Initialize resumable upload
      const initResponse = await fetch(`https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': videoFile.file.size.toString(),
          'X-Upload-Content-Type': videoFile.file.type
        },
        body: JSON.stringify(metadata)
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        return { 
          success: false, 
          message: error.error?.message || 'Failed to initialize YouTube upload',
          errorCode: error.error?.code
        };
      }

      const uploadUrl = initResponse.headers.get('Location');
      if (!uploadUrl) {
        return { success: false, message: 'Failed to get YouTube upload URL' };
      }

      // Step 2: Upload video file with progress tracking
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': videoFile.file.type,
          'Content-Length': videoFile.file.size.toString()
        },
        body: videoFile.file
      });

      if (uploadResponse.ok) {
        const data = await uploadResponse.json();
        return { 
          success: true, 
          message: 'Posted to YouTube successfully', 
          data: { 
            ...data, 
            url: `https://youtube.com/watch?v=${data.id}`,
            platform: 'youtube',
            apiVersion: 'v3'
          }
        };
      } else {
        const error = await uploadResponse.json();
        return { 
          success: false, 
          message: error.error?.message || 'Failed to upload to YouTube',
          errorCode: error.error?.code
        };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error posting to YouTube',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enhanced Twitter API v2 integration
  async postToTwitter(accessToken: string, content: string, media?: MediaFile[]): Promise<ApiResponse> {
    try {
      const apiVersion = 'v2';
      
      if (media && media.length > 0) {
        // Upload media first
        const mediaIds = await Promise.all(
          media.slice(0, 4).map(async (mediaFile) => { // Twitter allows max 4 media
            const uploadEndpoint = 'https://upload.twitter.com/1.1/media/upload.json';
            
            const formData = new FormData();
            formData.append('media', mediaFile.file);
            
            const uploadResponse = await fetch(uploadEndpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              body: formData
            });
            
            if (uploadResponse.ok) {
              const data = await uploadResponse.json();
              return data.media_id_string;
            }
            return null;
          })
        );

        const validMediaIds = mediaIds.filter(id => id !== null);
        
        // Create tweet with media
        const tweetData = {
          text: content,
          media: validMediaIds.length > 0 ? { media_ids: validMediaIds } : undefined
        };

        const response = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tweetData)
        });

        const data = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            message: 'Posted to Twitter successfully',
            data: {
              ...data,
              url: `https://twitter.com/user/status/${data.data.id}`,
              platform: 'twitter',
              apiVersion
            }
          };
        } else {
          return {
            success: false,
            message: data.errors?.[0]?.detail || 'Failed to post to Twitter'
          };
        }
      } else {
        // Text-only tweet
        const tweetData = { text: content };

        const response = await fetch('https://api.twitter.com/2/tweets', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tweetData)
        });

        const data = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            message: 'Posted to Twitter successfully',
            data: {
              ...data,
              url: `https://twitter.com/user/status/${data.data.id}`,
              platform: 'twitter',
              apiVersion
            }
          };
        } else {
          return {
            success: false,
            message: data.errors?.[0]?.detail || 'Failed to post to Twitter'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error posting to Twitter',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enhanced LinkedIn API integration
  async postToLinkedIn(accessToken: string, content: string, media?: MediaFile[]): Promise<ApiResponse> {
    try {
      const apiVersion = 'v2';
      
      // Get user profile first
      const profileResponse = await fetch('https://api.linkedin.com/v2/people/~', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      if (!profileResponse.ok) {
        return { success: false, message: 'Failed to get LinkedIn profile' };
      }

      const profile = await profileResponse.json();
      const authorUrn = `urn:li:person:${profile.id}`;

      if (media && media.length > 0) {
        // Handle media posts
        const mediaAssets = await Promise.all(
          media.slice(0, 9).map(async (mediaFile) => { // LinkedIn allows max 9 images
            // Register upload
            const registerData = {
              registerUploadRequest: {
                recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                owner: authorUrn,
                serviceRelationships: [{
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }]
              }
            };

            const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(registerData)
            });

            if (!registerResponse.ok) return null;

            const registerResult = await registerResponse.json();
            const uploadUrl = registerResult.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
            const asset = registerResult.value.asset;

            // Upload media
            const uploadResponse = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
              },
              body: mediaFile.file
            });

            return uploadResponse.ok ? asset : null;
          })
        );

        const validAssets = mediaAssets.filter(asset => asset !== null);

        // Create post with media
        const postData = {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content
              },
              shareMediaCategory: 'IMAGE',
              media: validAssets.map(asset => ({
                status: 'READY',
                description: {
                  text: content
                },
                media: asset,
                title: {
                  text: 'Social Media Post'
                }
              }))
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });

        const data = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            message: `Posted to LinkedIn with ${validAssets.length}/${media.length} media files`,
            data: {
              ...data,
              url: `https://linkedin.com/feed/update/${data.id}`,
              platform: 'linkedin',
              apiVersion
            }
          };
        } else {
          return {
            success: false,
            message: data.message || 'Failed to post to LinkedIn'
          };
        }
      } else {
        // Text-only post
        const postData = {
          author: authorUrn,
          lifecycleState: 'PUBLISHED',
          specificContent: {
            'com.linkedin.ugc.ShareContent': {
              shareCommentary: {
                text: content
              },
              shareMediaCategory: 'NONE'
            }
          },
          visibility: {
            'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
          }
        };

        const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData)
        });

        const data = await response.json();
        
        if (response.ok) {
          return {
            success: true,
            message: 'Posted to LinkedIn successfully',
            data: {
              ...data,
              url: `https://linkedin.com/feed/update/${data.id}`,
              platform: 'linkedin',
              apiVersion
            }
          };
        } else {
          return {
            success: false,
            message: data.message || 'Failed to post to LinkedIn'
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        message: 'Network error posting to LinkedIn',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generic posting method with enhanced error handling
  async postToPlatform(account: PlatformAccount, content: string, media?: MediaFile[]): Promise<ApiResponse> {
    if (!account.accessToken) {
      return { success: false, message: `${account.accountName} is not connected` };
    }

    try {
      switch (account.platformId) {
        case 'facebook':
          return await this.postToFacebook(account.accessToken, content, media);
        case 'instagram':
          return await this.postToInstagram(account.accessToken, content, media);
        case 'youtube':
          return await this.postToYouTube(account.accessToken, content, content, media);
        case 'twitter':
          return await this.postToTwitter(account.accessToken, content, media);
        case 'linkedin':
          return await this.postToLinkedIn(account.accessToken, content, media);
        case 'tiktok':
          // TikTok API integration would go here
          return { success: false, message: 'TikTok API integration coming soon' };
        default:
          return { success: false, message: 'Unknown platform' };
      }
    } catch (error) {
      return {
        success: false,
        message: `Unexpected error posting to ${account.accountName}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Enhanced token validation with profile information retrieval
  async validateToken(platform: { id: string; name: string }, accessToken: string): Promise<ApiResponse> {
    try {
      switch (platform.id) {
        case 'facebook':
          // Validate Page Access Token for Facebook and get Page info
          const fbResponse = await fetch(`https://graph.facebook.com/v23.0/me?fields=id,name,category,fan_count,picture,verification_status,about,website&access_token=${accessToken}`);
          const fbData = await fbResponse.json();
          
          if (fbResponse.ok) {
            // Check if it's a Page token (has category field)
            if (fbData.category) {
              return { 
                success: true, 
                message: `Facebook Page "${fbData.name}" validated successfully`, 
                data: { 
                  id: fbData.id,
                  username: fbData.name,
                  displayName: fbData.name,
                  followers: fbData.fan_count || 0,
                  profilePicture: fbData.picture?.data?.url,
                  verified: fbData.verification_status === 'blue_verified' || fbData.verification_status === 'gray_verified',
                  category: fbData.category,
                  about: fbData.about,
                  website: fbData.website,
                  platform: 'facebook', 
                  apiVersion: 'v23.0',
                  tokenType: 'page_access_token'
                }
              };
            } else {
              return {
                success: false,
                message: 'This appears to be a User Access Token. Facebook API requires a Page Access Token for posting.',
                hint: 'Get a Page Access Token from Facebook Developer Console with publish_pages permission.'
              };
            }
          } else {
            let errorMessage = fbData.error?.message || 'Invalid Facebook token';
            
            if (fbData.error?.code === 190) {
              errorMessage = 'Invalid or expired Facebook token. Please get a new Page Access Token.';
            }
            
            return { 
              success: false, 
              message: errorMessage,
              errorCode: fbData.error?.code,
              hint: 'Facebook only allows posting to Pages via API. Get a Page Access Token from Facebook Developer Console.'
            };
          }

        case 'instagram':
          // Get Instagram account info
          const igResponse = await fetch(`https://graph.instagram.com/v23.0/me?fields=id,username,account_type,media_count,followers_count,profile_picture_url&access_token=${accessToken}`);
          const igData = await igResponse.json();
          
          if (igResponse.ok) {
            return { 
              success: true, 
              message: `Instagram account "@${igData.username}" validated successfully`, 
              data: { 
                id: igData.id,
                username: igData.username,
                displayName: igData.username,
                followers: igData.followers_count || 0,
                profilePicture: igData.profile_picture_url,
                verified: false, // Instagram Basic Display API doesn't provide verification status
                accountType: igData.account_type,
                mediaCount: igData.media_count,
                platform: 'instagram', 
                apiVersion: 'v23.0' 
              }
            };
          } else {
            return { 
              success: false, 
              message: igData.error?.message || 'Invalid Instagram token',
              errorCode: igData.error?.code
            };
          }

        case 'youtube':
          // Get YouTube channel info
          const ytResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&mine=true`, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const ytData = await ytResponse.json();
          
          if (ytResponse.ok && ytData.items && ytData.items.length > 0) {
            const channel = ytData.items[0];
            return { 
              success: true, 
              message: `YouTube channel "${channel.snippet.title}" validated successfully`, 
              data: { 
                id: channel.id,
                username: channel.snippet.customUrl || channel.snippet.title,
                displayName: channel.snippet.title,
                followers: parseInt(channel.statistics.subscriberCount) || 0,
                profilePicture: channel.snippet.thumbnails?.default?.url,
                verified: false, // YouTube API doesn't provide verification status in this endpoint
                description: channel.snippet.description,
                country: channel.snippet.country,
                viewCount: parseInt(channel.statistics.viewCount) || 0,
                videoCount: parseInt(channel.statistics.videoCount) || 0,
                platform: 'youtube', 
                apiVersion: 'v3' 
              }
            };
          } else {
            return { 
              success: false, 
              message: ytData.error?.message || 'Invalid YouTube token or no channel found',
              errorCode: ytData.error?.code
            };
          }

        case 'twitter':
          // Get Twitter user info
          const twitterResponse = await fetch('https://api.twitter.com/2/users/me?user.fields=public_metrics,profile_image_url,verified,description,location', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const twitterData = await twitterResponse.json();
          
          if (twitterResponse.ok && twitterData.data) {
            const user = twitterData.data;
            return { 
              success: true, 
              message: `Twitter account "@${user.username}" validated successfully`, 
              data: { 
                id: user.id,
                username: user.username,
                displayName: user.name,
                followers: user.public_metrics?.followers_count || 0,
                profilePicture: user.profile_image_url,
                verified: user.verified || false,
                description: user.description,
                location: user.location,
                tweetCount: user.public_metrics?.tweet_count || 0,
                platform: 'twitter', 
                apiVersion: 'v2' 
              }
            };
          } else {
            return { 
              success: false, 
              message: twitterData.errors?.[0]?.detail || 'Invalid Twitter token'
            };
          }

        case 'linkedin':
          // Get LinkedIn profile info
          const linkedinResponse = await fetch('https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams),headline)', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });
          const linkedinData = await linkedinResponse.json();
          
          if (linkedinResponse.ok) {
            const displayName = `${linkedinData.firstName?.localized?.en_US || linkedinData.firstName?.preferredLocale?.language || ''} ${linkedinData.lastName?.localized?.en_US || linkedinData.lastName?.preferredLocale?.language || ''}`.trim();
            const profilePicture = linkedinData.profilePicture?.displayImage?.elements?.[0]?.identifiers?.[0]?.identifier;
            
            return { 
              success: true, 
              message: `LinkedIn profile "${displayName}" validated successfully`, 
              data: { 
                id: linkedinData.id,
                username: displayName.replace(/\s+/g, '').toLowerCase(),
                displayName: displayName,
                followers: 0, // LinkedIn API v2 doesn't provide follower count in basic profile
                profilePicture: profilePicture,
                verified: false, // LinkedIn API doesn't provide verification status
                headline: linkedinData.headline?.localized?.en_US || linkedinData.headline?.preferredLocale?.language,
                platform: 'linkedin', 
                apiVersion: 'v2' 
              }
            };
          } else {
            return { 
              success: false, 
              message: linkedinData.message || 'Invalid LinkedIn token'
            };
          }

        case 'tiktok':
          // TikTok API validation would go here
          return { 
            success: true, 
            message: 'TikTok token validation not implemented yet',
            data: {
              id: 'tiktok_user',
              username: 'TikTok User',
              displayName: 'TikTok User',
              followers: 0,
              platform: 'tiktok',
              apiVersion: 'v1'
            }
          };

        default:
          return { success: true, message: 'Token validation not implemented for this platform' };
      }
    } catch (error) {
      return { 
        success: false, 
        message: 'Network error validating token',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get platform-specific posting guidelines with latest API versions
  getPostingGuidelines(platformId: string): { [key: string]: any } {
    const guidelines = {
      facebook: {
        apiVersion: 'v23.0', // Latest version
        postingType: 'Page Only', // Important note
        textLimit: 63206,
        tokenRequired: 'Page Access Token',
        permissions: ['publish_pages', 'manage_pages'],
        mediaLimits: {
          photos: { max: 10, formats: ['jpg', 'png', 'gif'], maxSize: '10MB' },
          videos: { max: 1, formats: ['mp4', 'mov'], maxSize: '1GB', maxDuration: '240min' }
        },
        features: ['albums', 'privacy_settings', 'tagging', 'scheduling', 'targeting', 'insights'],
        note: 'Facebook API only supports posting to Pages, not personal profiles'
      },
      instagram: {
        apiVersion: 'v23.0', // Updated to match Facebook
        textLimit: 2200,
        mediaLimits: {
          photos: { max: 10, formats: ['jpg', 'png'], maxSize: '30MB' },
          videos: { max: 1, formats: ['mp4', 'mov'], maxSize: '650MB', maxDuration: '60min' }
        },
        features: ['carousel', 'stories', 'reels', 'hashtags', 'video_thumbnails', 'insights']
      },
      youtube: {
        apiVersion: 'v3',
        titleLimit: 100,
        descriptionLimit: 5000,
        mediaLimits: {
          videos: { max: 1, formats: ['mp4', 'mov', 'avi'], maxSize: '256GB', maxDuration: '12hours' }
        },
        features: ['thumbnails', 'categories', 'tags', 'privacy_settings', 'monetization', 'analytics']
      },
      twitter: {
        apiVersion: 'v2',
        textLimit: 280,
        mediaLimits: {
          photos: { max: 4, formats: ['jpg', 'png', 'gif'], maxSize: '5MB' },
          videos: { max: 1, formats: ['mp4', 'mov'], maxSize: '512MB', maxDuration: '2.2min' }
        },
        features: ['threads', 'polls', 'hashtags', 'mentions', 'spaces', 'analytics']
      },
      linkedin: {
        apiVersion: 'v2',
        textLimit: 3000,
        mediaLimits: {
          photos: { max: 9, formats: ['jpg', 'png', 'gif'], maxSize: '20MB' },
          videos: { max: 1, formats: ['mp4', 'mov'], maxSize: '5GB', maxDuration: '10min' }
        },
        features: ['articles', 'company_pages', 'professional_hashtags', 'analytics', 'lead_gen']
      }
    };

    return guidelines[platformId as keyof typeof guidelines] || {};
  }
}

export const apiService = new ApiService();