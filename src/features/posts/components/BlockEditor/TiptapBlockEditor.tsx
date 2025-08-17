import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import { PostApiService } from '../../services/postApi';
import type { ContentBlock } from '../../types/post.types';
import { Upload } from 'lucide-react';

export interface TiptapBlockEditorProps {
  value?: ContentBlock[];
  onChange?: (blocks: ContentBlock[]) => void;
  placeholder?: string;
}

// We store the full Tiptap JSON doc in a single block for now to keep mapping simple
// { type: 'tiptap', data: { doc: <JSON> } }
export default function TiptapBlockEditor({ value, onChange, placeholder = 'Write something…' }: TiptapBlockEditorProps) {
  const api = useMemo(() => PostApiService.getInstance(), []);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialJSON = useMemo(() => {
    const tiptapBlock = value?.find(b => b.type === 'tiptap');
    if (tiptapBlock && tiptapBlock.data && typeof tiptapBlock.data === 'object') {
      // support both { doc } and direct doc
      return (tiptapBlock.data.doc ?? tiptapBlock.data) as any;
    }
    return undefined;
  }, [value]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Link.configure({ openOnClick: true }),
      Image.configure({ inline: false, allowBase64: true }),
      Placeholder.configure({
        placeholder,
        includeChildren: true,
      }),
      CharacterCount.configure({
        limit: 0, // no hard limit, we just display counts
      }),
    ],
    content: initialJSON ?? '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[500px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      onChange?.([{ type: 'tiptap', data: { doc: json } }]);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!value) return;
    const jb = value.find(b => b.type === 'tiptap');
    const next = (jb && (jb.data?.doc ?? jb.data)) as any;
    if (next) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  const handleInsertImage = useCallback(async () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  }, []);

  const onFileSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setIsUploading(true);
      const res = await api.uploadFile(file);
      const url = (res.urls && (res.urls.optimized || res.urls.original)) || res.url || res.data?.url;
      if (!url) return;
      editor?.chain().focus().setImage({ src: url }).run();
    } finally {
      setIsUploading(false);
    }
  }, [api, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Set link URL', previousUrl || 'https://');
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const copySelectedCode = useCallback(async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, '\n');
    if (!text) return;
    await navigator.clipboard.writeText(text);
  }, [editor]);

  return (
    <div className="space-y-2">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('bold') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()}>B</button>
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('italic') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('strike') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleStrike().run()}>S</button>
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('code') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleCode().run()}>Code</button>
        </div>
        <div className="flex items-center gap-1">
          {[1,2,3].map(l => (
            <button key={l} type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('heading', { level: l }) ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleHeading({ level: l as any }).run()}>
              H{l}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('bulletList') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• List</button>
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('orderedList') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. List</button>
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('blockquote') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('codeBlock') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={() => editor?.chain().focus().toggleCodeBlock().run()}>Code Block</button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className={`px-2 py-1 text-sm rounded border ${editor?.isActive('link') ? 'bg-gray-200 dark:bg-gray-700' : ''}`} onClick={setLink}>Link</button>
          <button type="button" className="px-2 py-1 text-sm rounded border" onClick={() => editor?.chain().focus().unsetLink().run()}>Unlink</button>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="px-2 py-1 text-sm rounded border" onClick={() => editor?.chain().focus().undo().run()}>Undo</button>
          <button type="button" className="px-2 py-1 text-sm rounded border" onClick={() => editor?.chain().focus().redo().run()}>Redo</button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
            onClick={handleInsertImage}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading…' : 'Insert image'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
        </div>
        {editor?.isActive('codeBlock') && (
          <button type="button" className="px-2 py-1 text-sm rounded border" onClick={copySelectedCode}>
            Copy code
          </button>
        )}
      </div>

      {/* Editor */}
      <div className="border rounded-md p-3 bg-white dark:bg-gray-900 resize-y overflow-auto">
        {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
        <EditorContent editor={editor} />
      </div>

      {/* Character count */}
      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
        <span>Chars: {editor?.storage.characterCount.characters()}</span>
        <span>Words: {editor?.storage.characterCount.words()}</span>
      </div>

      {!value?.length && (
        <div className="text-sm text-gray-500 dark:text-gray-400">{placeholder}</div>
      )}
    </div>
  );
}
