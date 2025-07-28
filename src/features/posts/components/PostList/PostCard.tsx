/**
 * PostCard Component
 * Individual post card with CRUD operations
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PostData } from '../../types/post.types';
import { cn } from '../../../../lib/utils';
import SafeImage from '../../../../components/SafeImage';
import { useLazyLoading } from '../../../../hooks/useLazyLoading';
import { isMobileDevice } from '../../../../utils/mobileOptimizations';
import { 
  Calendar, 
  User, 
  Eye, 
  Heart, 
  Edit, 
  Trash2, 
  MoreVertical,
  ExternalLink,
  Globe
} from 'lucide-react';

interface PostCardProps {
  post: PostData;
  layout?: 'grid' | 'list';
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPublish?: (id: string) => void;
  showActions?: boolean;
  isPublishing?: boolean;
  className?: string;
}

export function PostCard({
  post,
  layout = 'grid',
  onEdit,
  onDelete,
  onPublish,
  showActions = true,
  isPublishing = false,
  className = '',
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Format date
  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Handle delete with confirmation
  const handleDelete = async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    if (onEdit) {
      onEdit(post.id);
    }
    setShowMenu(false);
  };

  // Handle publish
  const handlePublish = async () => {
    if (!onPublish) return;
    
    try {
      await onPublish(post.id);
    } finally {
      setShowMenu(false);
    }
  };

  if (layout === 'list') {
    return (
      <div className={cn(
        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow',
        className
      )}>
        <div className="flex items-start space-x-4">
          {/* Cover Image */}
          {post.coverImage && (
            <Link to={`/posts/${post.id}`} className="flex-shrink-0">
              <SafeImage
                src={post.coverImage}
                alt={post.title}
                className="w-24 h-24 object-cover rounded-lg"
                width={96}
                height={96}
                loading="lazy"
                quality={isMobileDevice() ? 70 : 80}
                format="auto"
                responsive={true}
              />
            </Link>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link to={`/posts/${post.id}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {post.title}
                  </h3>
                </Link>
                
                {post.summary && (
                  <p className="text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {post.summary}
                  </p>
                )}

                {/* Meta information */}
                <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(post.createdAt)}
                  </div>
                  
                  {post.author && (
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      {post.author.username}
                    </div>
                  )}

                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {post.stats?.viewCount || 0}
                  </div>

                  <div className="flex items-center">
                    <Heart className="h-4 w-4 mr-1" />
                    {post.stats?.likeCount || 0}
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              {showActions && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  {showMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                      <div className="py-1">
                        <Link
                          to={`/posts/${post.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setShowMenu(false)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Post
                        </Link>
                        
                        {onEdit && (
                          <button
                            onClick={handleEdit}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Post
                          </button>
                        )}
                        
                        {onPublish && post.status === 'draft' && (
                          <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                          >
                            <Globe className="h-4 w-4 mr-2" />
                            {isPublishing ? 'Publishing...' : 'Publish Post'}
                          </button>
                        )}
                        
                        {onDelete && (
                          <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeleting ? 'Deleting...' : 'Delete Post'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow',
      className
    )}>
      {/* Cover Image */}
      {post.coverImage && (
        <Link to={`/posts/${post.id}`}>
          <SafeImage
            src={post.coverImage}
            alt={post.title}
            className="w-full h-48 object-cover"
            height={192}
            loading="lazy"
            quality={isMobileDevice() ? 70 : 80}
            format="auto"
            responsive={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link to={`/posts/${post.id}`} className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors line-clamp-2">
              {post.title}
            </h3>
          </Link>

          {/* Actions Menu */}
          {showActions && (
            <div className="relative ml-2">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                  <div className="py-1">
                    <Link
                      to={`/posts/${post.id}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => setShowMenu(false)}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Post
                    </Link>
                    
                    {onEdit && (
                      <button
                        onClick={handleEdit}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Post
                      </button>
                    )}
                    
                    {onPublish && post.status === 'draft' && (
                      <button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="flex items-center w-full px-4 py-2 text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-50"
                      >
                        <Globe className="h-4 w-4 mr-2" />
                        {isPublishing ? 'Publishing...' : 'Publish Post'}
                      </button>
                    )}
                    
                    {onDelete && (
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete Post'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {post.summary && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-3">
            {post.summary}
          </p>
        )}

        {/* Meta information */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {formatDate(post.createdAt)}
            </div>
            
            {post.author && (
              <div className="flex items-center">
                <User className="h-3 w-3 mr-1" />
                {post.author.username}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center">
              <Eye className="h-3 w-3 mr-1" />
              {post.stats?.viewCount || 0}
            </div>
            
            <div className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {post.stats?.likeCount || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
