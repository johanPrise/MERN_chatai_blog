import React, { useEffect, useState, useRef, useCallback } from 'react';
import { formatContent } from '../lib/formatContent';
import { useMarkdownTheme } from '../hooks/useMarkdownTheme';
import '../css/markdown.css';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Composant pour rendre du contenu Markdown avec prise en charge du thème
 */
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  const { isDarkMode, themeVariables } = useMarkdownTheme();
  const [formattedContent, setFormattedContent] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // Gestionnaire de copie de code
  const handleCopyCode = useCallback((codeBlock: HTMLElement) => {
    const code = Array.from(codeBlock.querySelectorAll('.code-line'))
      .map(line => line.textContent?.replace(/^\d+\s+/, '') || '')
      .join('\n');

    navigator.clipboard.writeText(code)
      .then(() => {
        // Feedback visuel de succès
        const copyButton = codeBlock.parentElement?.querySelector('.code-copy-button');
        if (copyButton) {
          const originalText = copyButton.innerHTML;
          copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
          setTimeout(() => {
            copyButton.innerHTML = originalText;
          }, 2000);
        }
      })
      .catch(err => {
        console.error('Erreur lors de la copie du code:', err);
      });
  }, []);

  // Formater le contenu
  useEffect(() => {
    setFormattedContent(formatContent(content));
  }, [content]);

  // Forcer une mise à jour du DOM après un changement de thème
  useEffect(() => {
    // Forcer un rafraîchissement des styles pour les blocs de code
    if (contentRef.current) {
      const codeBlocks = contentRef.current.querySelectorAll('.markdown-body pre');
      codeBlocks.forEach(pre => {
        (pre as HTMLElement).style.backgroundColor = '';
        (pre as HTMLElement).style.borderColor = '';
        setTimeout(() => {
          (pre as HTMLElement).style.backgroundColor = getComputedStyle(pre).backgroundColor;
          (pre as HTMLElement).style.borderColor = getComputedStyle(pre).borderColor;
        }, 0);
      });

      // Forcer un recalcul des styles pour tout le contenu markdown
      const markdownBody = contentRef.current.querySelector('.markdown-body');
      if (markdownBody) {
        markdownBody.classList.add('theme-refresh');
        setTimeout(() => markdownBody.classList.remove('theme-refresh'), 10);
      }
    }
  }, [isDarkMode]);

  // Ajouter les gestionnaires d'événements après le rendu du contenu
  useEffect(() => {
    if (!contentRef.current) return;

    // Ajouter les gestionnaires pour les boutons de copie de code
    const copyButtons = contentRef.current.querySelectorAll('.code-copy-button');
    copyButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const pre = (e.currentTarget as HTMLElement).closest('pre');
        const codeBlock = pre?.querySelector('code');
        if (codeBlock) handleCopyCode(codeBlock as HTMLElement);
      });
    });

    // Ajouter les gestionnaires pour les images zoomables
    const zoomableImages = contentRef.current.querySelectorAll('img.zoomable');
    zoomableImages.forEach(img => {
      img.addEventListener('click', () => {
        (img as HTMLElement).classList.toggle('zoomed');
      });
      // Support du clavier pour l'accessibilité
      img.addEventListener('keydown', (e) => {
        if ((e as KeyboardEvent).key === 'Enter' || (e as KeyboardEvent).key === ' ') {
          e.preventDefault();
          (img as HTMLElement).classList.toggle('zoomed');
        }
      });
    });

    // Nettoyage des événements à la destruction du composant
    return () => {
      copyButtons.forEach(button => {
        button.removeEventListener('click', (e) => {
          e.preventDefault();
          const pre = (e.currentTarget as HTMLElement).closest('pre');
          const codeBlock = pre?.querySelector('code');
          if (codeBlock) handleCopyCode(codeBlock as HTMLElement);
        });
      });

      zoomableImages.forEach(img => {
        img.removeEventListener('click', () => {
          (img as HTMLElement).classList.toggle('zoomed');
        });
        img.removeEventListener('keydown', (e) => {
          if ((e as KeyboardEvent).key === 'Enter' ||(e as KeyboardEvent).key === ' ') {
            e.preventDefault();
            (img as HTMLElement).classList.toggle('zoomed');
          }
        });
      });
    };
  }, [formattedContent, handleCopyCode]);

  return (
    <div
      className={`markdown-content ${className} ${isDarkMode ? 'dark-mode' : 'light-mode'}`}
      data-theme={isDarkMode ? 'dark' : 'light'}
      style={themeVariables as React.CSSProperties}
      ref={contentRef}
    >
      <div 
        className="markdown-body"
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    </div>
  );
};

export default MarkdownRenderer;
