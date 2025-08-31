/**
 * Post Preview Component
 * Displays a preview of the post as it would appear when published
 */

import React, { useMemo } from 'react';
import { X, Calendar, User, Tag, Eye, Clock } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import MarkdownRenderer from '../../../../components/MarkdownRenderer';
import { getImageUrl } from '../../../../config/api.config';
import SafeImage from '../../../../components/SafeImage';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import type { ContentBlock } from '../../types/post.types';

interface PostPreviewProps {
  title: string;
  summary: string;
  content: string;
  contentBlocks?: ContentBlock[];
  coverImage?: string;
  tags?: string[];
  categoryName?: string;
  onClose: () => void;
  className?: string;
}

export function PostPreview({
  title,
  summary,
  content,
  contentBlocks = [],
  coverImage,
  tags = [],
  categoryName,
  onClose,
  className = '',
}: PostPreviewProps) {
  const getDisplayImageUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return getImageUrl(url);
  };

  // Extract plain text from a Tiptap JSON document
  const extractTextFromDoc = (doc: any): string => {
    if (!doc) return '';
    const texts: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (node.type === 'text' && node.text) {
        texts.push(node.text);
      }
      if (Array.isArray(node.content)) {
        node.content.forEach(walk);
      }
    };
    walk(doc);
    return texts.join(' ');
  };

  const tiptapDoc = useMemo(() => {
    const block = contentBlocks.find(b => b.type === 'tiptap');
    // We expect the tiptap block to store { data: { doc } }
    const doc = block?.data?.doc || block?.data || null;
    return doc ?? null;
  }, [contentBlocks]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link,
      Image,
    ],
    editable: false,
    content: tiptapDoc || undefined,
  });

  const formatReadingTime = (markdownOrText: string) => {
    const wordsPerMinute = 200;
    const words = markdownOrText.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min de lecture`;
  };

  const readingSource = tiptapDoc ? extractTextFromDoc(tiptapDoc) : content;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn(
        'bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden',
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Eye className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Aperçu de l'article
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <article className="max-w-3xl mx-auto p-6">
            {/* Cover Image */}
            {coverImage && (
              <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
                <SafeImage
                  src={coverImage}
                  alt={title || 'Image de couverture'}
                  className="w-full h-64 md:h-80 object-cover"
                  height={320}
                  loading="eager"
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
              {/* Category */}
              {categoryName && (
                <div className="mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {categoryName}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                {title || 'Titre de l\'article'}
              </h1>

              {/* Summary */}
              {summary && (
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {summary}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Auteur</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{formatReadingTime(readingSource)}</span>
                </div>
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </header>

            {/* Article Content */}
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {tiptapDoc ? (
                editor ? <EditorContent editor={editor} /> : null
              ) : content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic text-center py-12">
                  Aucun contenu à afficher. Commencez à écrire votre article pour voir l'aperçu.
                </div>
              )}
            </div>
          </article>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Ceci est un aperçu de votre article
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Fermer l'aperçu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}