"use client";

import React, { memo, useCallback, useEffect, useRef } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Undo,
  Redo,
  Heading2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SoundEffects } from '@/app/hooks/useSoundEffects';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string, json: any) => void;
  placeholder?: string;
  minHeight?: number;
  maxHeight?: number;
  className?: string;
}

export const RichTextEditor = memo(({
  content,
  onChange,
  placeholder = "Write your analysis...",
  minHeight = 200,
  maxHeight = 400,
  className = "",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-white underline cursor-pointer hover:text-white',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: `prose prose-invert prose-sm max-w-none focus:outline-none min-h-[${minHeight}px]`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      onChange(html, json);
    },
  });

  // Sync content from parent
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div 
        className="bg-black/50 border border-white/30 rounded-xl p-4 animate-pulse"
        style={{ minHeight }}
      >
        <div className="h-4 bg-neutral-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-neutral-700 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-white/30 bg-black/50 overflow-hidden ${className}`}>
      {/* Toolbar */}
      <EditorToolbar editor={editor} />
      
      {/* Editor Content */}
      <div 
        className="p-4 overflow-y-auto"
        style={{ minHeight, maxHeight }}
      >
        <EditorContent 
          editor={editor} 
          className="[&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_.is-editor-empty:first-child]:before:text-neutral-500 [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:pointer-events-none"
        />
      </div>
    </div>
  );
});

RichTextEditor.displayName = 'RichTextEditor';

// Toolbar Component
interface EditorToolbarProps {
  editor: Editor;
}

const EditorToolbar = memo(({ editor }: EditorToolbarProps) => {
  const handleLink = useCallback(() => {
    SoundEffects.click();
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const handleImage = useCallback(() => {
    SoundEffects.click();
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const buttons = [
    {
      icon: <Bold className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive('bold'),
      tooltip: 'Bold',
    },
    {
      icon: <Italic className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive('italic'),
      tooltip: 'Italic',
    },
    { divider: true },
    {
      icon: <Heading2 className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive('heading', { level: 2 }),
      tooltip: 'Heading',
    },
    {
      icon: <List className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive('bulletList'),
      tooltip: 'Bullet List',
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive('orderedList'),
      tooltip: 'Numbered List',
    },
    { divider: true },
    {
      icon: <Quote className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive('blockquote'),
      tooltip: 'Quote',
    },
    {
      icon: <Code className="w-4 h-4" />,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive('codeBlock'),
      tooltip: 'Code Block',
    },
    { divider: true },
    {
      icon: <LinkIcon className="w-4 h-4" />,
      action: handleLink,
      isActive: editor.isActive('link'),
      tooltip: 'Link',
    },
    {
      icon: <ImageIcon className="w-4 h-4" />,
      action: handleImage,
      isActive: false,
      tooltip: 'Image',
    },
    { divider: true },
    {
      icon: <Undo className="w-4 h-4" />,
      action: () => editor.chain().focus().undo().run(),
      isActive: false,
      disabled: !editor.can().undo(),
      tooltip: 'Undo',
    },
    {
      icon: <Redo className="w-4 h-4" />,
      action: () => editor.chain().focus().redo().run(),
      isActive: false,
      disabled: !editor.can().redo(),
      tooltip: 'Redo',
    },
  ];

  return (
    <div className="flex items-center gap-1 p-2 border-b border-white/20 bg-black/30 flex-wrap">
      {buttons.map((button, index) => {
        if ('divider' in button && button.divider) {
          return <div key={index} className="w-px h-5 bg-neutral-700 mx-1" />;
        }
        
        const btn = button as {
          icon: React.ReactNode;
          action: () => void;
          isActive: boolean;
          disabled?: boolean;
          tooltip: string;
        };
        
        return (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { SoundEffects.click(); btn.action(); }}
            disabled={btn.disabled}
            title={btn.tooltip}
            className={`
              p-2 rounded-lg transition-colors
              ${btn.isActive 
                ? 'bg-white text-black' 
                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }
              ${btn.disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {btn.icon}
          </motion.button>
        );
      })}
    </div>
  );
});

EditorToolbar.displayName = 'EditorToolbar';

export default RichTextEditor;
