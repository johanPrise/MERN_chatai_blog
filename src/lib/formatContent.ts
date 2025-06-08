import hljs from 'highlight.js';

// Injecter les variables CSS pour les couleurs de syntaxe
const injectSyntaxThemeVariables = () => {
  // Vérifier si les variables sont déjà injectées
  if (document.getElementById('syntax-theme-variables')) return;

  const style = document.createElement('style');
  style.id = 'syntax-theme-variables';
  style.textContent = `
    :root {
      --syntax-comment: #008000;
      --syntax-keyword: #0000ff;
      --syntax-string: #a31515;
      --syntax-number: #098658;
      --syntax-function: #444;
      --syntax-background: #f0f0f0;
      --syntax-foreground: #333;
      --syntax-border: #ddd;
    }

    html.dark, [data-theme="dark"], [data-mode="dark"] {
      --syntax-comment: #6a9955;
      --syntax-keyword: #569cd6;
      --syntax-string: #ce9178;
      --syntax-number: #b5cea8;
      --syntax-function: #dcdcaa;
      --syntax-background: #1a1a1a;
      --syntax-foreground: #e0e0e0;
      --syntax-border: #333;
    }

    @media (prefers-color-scheme: dark) {
      body:not(.light):not([data-theme="light"]):not([data-mode="light"]) {
        --syntax-comment: #6a9955;
        --syntax-keyword: #569cd6;
        --syntax-string: #ce9178;
        --syntax-number: #b5cea8;
        --syntax-function: #dcdcaa;
        --syntax-background: #1a1a1a;
        --syntax-foreground: #e0e0e0;
        --syntax-border: #333;
      }
    }
  `;
  document.head.appendChild(style);
};

/**
 * Format content with enhanced styling and syntax highlighting
 * @param content - Content to format (can be Markdown or HTML)
 * @returns Formatted HTML string
 */
export const formatContent = (content: string): string => {
  // Vérifier si le contenu est déjà du HTML ou du Markdown
  const isHTML = content.trim().startsWith('<') && content.includes('</');    

  // Fonction pour détecter si le contenu contient vraiment du Markdown
  const hasMarkdownSyntax = (text: string): boolean => {
    const markdownPatterns = [
      /^#+\s/m,           // Headers avec #
      /\*\*.*?\*\*/,      // Bold
      /\*(?!\*)[^*]+\*/,  // Italic (éviter les conflits avec bold)
      /```[\s\S]*?```/,   // Code blocks
      /`[^`\n]+`/,        // Inline code
      /^\*\s/m,           // Unordered list
      /^\d+\.\s/m,        // Ordered list
      /^>\s/m,           // Blockquote
      /\[.*?\]\(.*?\)/,   // Links
      /!\[.*?\]\(.*?\)/,  // Images
      /^---+$/m,          // Horizontal rules
      /~~.*?~~/,          // Strikethrough
        /^\|(.+\|)+$/m,     // Tables (première ligne)
        /^\|\s*(:?-+:?\|)+$/m // Tables (ligne de délimitation)
    ];

    return markdownPatterns.some(pattern => pattern.test(text));
  };

  let htmlContent = content;

  // Si ce n'est pas du HTML, vérifier s'il contient du Markdown
  // et le convertir en HTML uniquement s'il contient vraiment du Markdown
  if (!isHTML && hasMarkdownSyntax(content)) {
    // Préserver les blocs de code pour le traitement ultérieur
    const codeBlocks: Array<{language: string, code: string}> = [];

    // Extraire les blocs de code avec leur langage
    htmlContent = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
      const id = codeBlocks.length;
      codeBlocks.push({ language, code });
      return `CODEBLOCK${id}`;
    });

    // Conversion améliorée de Markdown en HTML
    htmlContent = htmlContent
      // Convertir les titres avec ancres pour la navigation
      .replace(/^# (.*$)/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h1 id="${id}">${title}</h1>`;
      })
      .replace(/^## (.*$)/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h2 id="${id}">${title}</h2>`;
      })
      .replace(/^### (.*$)/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h3 id="${id}">${title}</h3>`;
      })
      .replace(/^#### (.*$)/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h4 id="${id}">${title}</h4>`;
      })
      .replace(/^##### (.*$)/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h5 id="${id}">${title}</h5>`;
      })
      .replace(/^###### (.*$)/gm, (match, title) => {
        const id = title.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h6 id="${id}">${title}</h6>`;
      })

      // Convertir les paragraphes - plus conservateur pour éviter les conflits
      .replace(/^(?!<[^>]+>|#+\s|[\*\-\+]\s|\d+\.\s|>\s|```|`)(.*\S.*$)/gm, function(match) {
        const trimmed = match.trim();
        // Ne pas entourer de <p> si c'est déjà du HTML, vide, ou contient du markdown
        if (!trimmed || trimmed.startsWith('<') || trimmed.includes('</') ||
            trimmed.match(/^#+\s/) || trimmed.match(/^\*\*.*\*\*$/) ||
            trimmed.match(/^\*.*\*$/) || trimmed.match(/^`.*`$/)) {
          return match;
        }
        return '<p>' + trimmed + '</p>';
      })

      // Convertir les listes non ordonnées
      .replace(/^[\*\-] (.*$)/gm, '<li>$1</li>')

      // Convertir les listes ordonnées
      .replace(/^(\d+)\. (.*$)/gm, '<li value="$1">$2</li>')

      // Entourer les listes avec <ul> ou <ol>
      .replace(/(<li value="[0-9]+".*<\/li>)\n(?!<li value="[0-9]+")/g, '$1</ol>')
      .replace(/(?<!<\/ol>)\n(<li value="[0-9]+")/g, '<ol>$1')
      .replace(/(<li>.*<\/li>)\n(?!<li>)/g, '$1</ul>')
      .replace(/(?<!<\/ul>)\n(<li>)/g, '<ul>$1')

      // Convertir le texte en gras
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')

      // Convertir le texte en italique (en évitant les conflits avec le gras)
      .replace(/(?<!\*)\*(?!\*)([^\*]+)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
      .replace(/(?<!_)_(?!_)([^_]+)(?<!_)_(?!_)/g, '<em>$1</em>')

      // Convertir le texte barré
      .replace(/~~(.*?)~~/g, '<del>$1</del>')

      // Convertir les liens
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

      // Convertir les images avec attributs alt et title
      .replace(/!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g, (match, alt, src, title) => {
        return `<img alt="${alt || ''}" src="${src}" ${title ? `title="${title}"` : ''} loading="lazy" />`;
      })

      // Convertir les citations
      .replace(/^>\s*(.*$)/gm, '<blockquote>$1</blockquote>')

      // Convertir les séparateurs horizontaux
      .replace(/^---+$/gm, '<hr />')

      // Traitement des tableaux Markdown
      .replace(/^\|(.+)\|\s*$/gm, (match, content) => {
        // Vérifier si nous sommes sur une ligne d'en-tête ou de délimitation
        const isDelimiter = /^\s*:?-+:?\s*\|/.test(content);
        if (isDelimiter) return match; // On la conserve pour la traiter après

        // Traiter les cellules du tableau
        const cells = content.split('|')
          .map(cell => cell.trim())
          .filter(cell => cell !== '');

        // Si nous avons des cellules valides
        if (cells.length > 0) {
          const isHeader = content.includes('\n') && /^\|\s*:?-+:?\s*\|/.test(content.split('\n')[1]);
          const cellTag = isHeader ? 'th' : 'td';
          return `<tr>${cells.map(cell => `<${cellTag}>${cell}</${cellTag}>`).join('')}</tr>`;
        }
        return match;
      })
      // Convertir les lignes de délimitation en définition de tableau
      .replace(/^\|(.*?)\|\s*$/gm, (match, content) => {
        if (/^\s*:?-+:?\s*\|/.test(content)) {
          return ''; // Supprimer la ligne de délimitation
        }
        return match;
      })
      // Envelopper les tableaux
      .replace(/(<tr>.+?<\/tr>)(\n*)(<tr>.+?<\/tr>)/g, (match, headerRow, spacing, bodyRows) => {
        return `<table class="markdown-table"><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>`;
      })

      // Convertir les sauts de ligne
      .replace(/\n\n/g, '<br /><br />');

    // Réinsérer les blocs de code avec coloration syntaxique
    htmlContent = htmlContent.replace(/CODEBLOCK(\d+)/g, (match, id) => {
      try {
        const blockId = parseInt(id, 10);
        if (blockId >= 0 && blockId < codeBlocks.length) {
          const { language, code } = codeBlocks[blockId];
          let highlightedCode;

          try {
            // Injecter les variables CSS pour les thèmes de syntaxe
            injectSyntaxThemeVariables();

            // Vérifier si highlight.js est disponible
            if (typeof hljs !== 'undefined' && hljs !== null && typeof hljs.highlight === 'function') {
              // Essayer d'appliquer la coloration syntaxique
              highlightedCode = language && language.trim() !== ''
                ? hljs.highlight(code.trim(), { language }).value
                : hljs.highlightAuto(code.trim()).value;
            } else {
              throw new Error("highlight.js n'est pas disponible");
            }
          } catch (e) {
            console.error("Erreur lors de la coloration syntaxique:", e);
            // Échapper le HTML pour l'afficher tel quel
            highlightedCode = code
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
          }

          return `<pre><code class="language-${language || 'plaintext'}">${highlightedCode}</code></pre>`;
        } else {
          console.error(`Bloc de code avec ID ${id} non trouvé`);
          return match; // Retourner le texte original si l'ID n'est pas valide
        }
      } catch (error) {
        console.error("Erreur lors du traitement du bloc de code:", error);
        return `<pre><code>Erreur lors du traitement du bloc de code</code></pre>`;
      }
    });

    // Convertir les blocs de code inline
    htmlContent = htmlContent.replace(/`([^`]+)`/g, (match, code) => {
      return `<code>${code}</code>`;
    });

    // Méthode alternative pour les blocs de code si la première méthode échoue
    if (htmlContent.includes("CODEBLOCK")) {
      console.warn("Détection de blocs de code non traités, application de la méthode alternative");

      // Traiter directement les blocs de code sans extraction préalable
      htmlContent = content.replace(/```(\w*)\n([\s\S]*?)```/g, (match, language, code) => {
        try {
          // Échapper le HTML pour l'afficher tel quel
          const escapedCode = code
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

          return `<pre><code class="language-${language || 'plaintext'}">${escapedCode}</code></pre>`;
        } catch (error) {
          console.error("Erreur lors du traitement direct du bloc de code:", error);
          return `<pre><code>${code}</code></pre>`;
        }
      });
    }
  } else if (!isHTML) {
    // Si ce n'est pas du HTML et pas du Markdown, traiter comme texte brut
    // Seulement entourer de <p> si c'est un paragraphe simple
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length === 1) {
      // Une seule ligne, probablement un titre ou texte simple
      htmlContent = `<p>${content}</p>`;
    } else {
      // Plusieurs lignes, traiter chaque ligne comme un paragraphe
      htmlContent = lines.map(line => `<p>${line.trim()}</p>`).join('\n');
    }
  }

  // Maintenant, on traite le HTML pour améliorer le style
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, "text/html")

  // Ajouter des attributs data-aos pour les animations au défilement
  doc.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading, index) => {
    heading.setAttribute("data-aos", "fade-up");
    heading.setAttribute("data-aos-delay", `${index * 50}`);
    heading.setAttribute("data-aos-duration", "800");

    // Ajouter une classe pour garantir la réactivité au thème et accessibilité
    heading.classList.add('md-heading');

    // Ajouter un id si non existant pour la navigation
    if (!heading.id) {
      const headingText = heading.textContent || '';
      heading.id = headingText.toLowerCase().replace(/[^\w]+/g, '-');
    }
  });

  // Ajouter des classes pour améliorer la réactivité au thème
  doc.querySelectorAll("p").forEach((p) => {
    p.classList.add('md-paragraph');
  });

  // Ajouter des attributs data-aos pour les images
  doc.querySelectorAll("img").forEach((img, index) => {
    img.setAttribute("data-aos", "zoom-in");
    img.setAttribute("data-aos-delay", `${index * 100}`);
    img.setAttribute("data-aos-duration", "1000");

    // Ajouter une classe pour le zoom au clic
    img.classList.add("zoomable");

    // S'assurer que toutes les images ont un attribut alt pour l'accessibilité
    if (!img.getAttribute('alt')) {
      img.setAttribute('alt', 'Image dans le contenu');
    }

    // Ajouter un attribut role et tabindex pour l'accessibilité
    img.setAttribute('role', 'button');
    img.setAttribute('tabindex', '0');
    img.setAttribute('aria-label', 'Cliquez pour agrandir l\'image');

    // Supprimer l'événement existant car il ne fonctionnera pas correctement dans ce contexte
    // Nous utiliserons CSS pour gérer le zoom
  });

  // Ajouter des attributs data-aos pour les blocs de code
  doc.querySelectorAll("pre").forEach((pre, index) => {
    pre.setAttribute("data-aos", "fade-up");
    pre.setAttribute("data-aos-delay", `${index * 50}`);

    // Ajouter une classe pour le thème de code
    pre.classList.add('code-block-theme-aware');

    // Ajouter un bouton de copie
    const copyButton = document.createElement('button');
    copyButton.className = 'code-copy-button';
    copyButton.setAttribute('aria-label', 'Copier le code');
    copyButton.setAttribute('title', 'Copier le code');
    copyButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    pre.appendChild(copyButton);
  });

  // Ajouter des attributs data-aos pour les citations
  doc.querySelectorAll("blockquote").forEach((quote, index) => {
    quote.setAttribute("data-aos", "fade-right");
    quote.setAttribute("data-aos-delay", `${index * 50}`);

    // Ajouter une classe pour la réactivité au thème
    quote.classList.add('md-blockquote');
  });

  // Ajouter des numéros de ligne aux blocs de code
  doc.querySelectorAll("pre code").forEach((codeBlock) => {
    const code = codeBlock.textContent || "";
    const lines = code.split("\n");
    let numberedCode = "";

    lines.forEach((line, index) => {
      if (index === lines.length - 1 && !line.trim()) return;
      // Ajouter une classe pour les lignes vides pour un meilleur rendu
      const lineClass = line.trim() === '' ? 'code-line empty-line' : 'code-line';
      numberedCode += `<div class="${lineClass}" data-line-number="${index + 1}"><span class="line-number">${index + 1}</span>${line}</div>`;
    });

    codeBlock.innerHTML = numberedCode;
  });

  // Ajouter des liens aux titres pour permettre le partage direct
  doc.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]").forEach((heading) => {
    const id = heading.getAttribute("id");
    const link = document.createElement("a");
    link.href = `#${id}`;
    link.className = "heading-link";
    link.innerHTML = "#";
    link.title = "Lien direct vers cette section";
    link.setAttribute('aria-label', `Lien vers la section ${heading.textContent}`);
    heading.appendChild(link);
  });

  // Ajouter des styles pour les tableaux si présents
  doc.querySelectorAll("table").forEach((table) => {
    table.classList.add("markdown-table");
  });

  return doc.body.innerHTML;
};
