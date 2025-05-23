import { Feed } from 'feed';
import pool from '../db.js';
import { marked } from 'marked';

export default class RssService {
  constructor() {
    marked.setOptions({
      gfm: true,
      breaks: true,
      sanitize: true
    });

    marked.use({
      extensions: [{
        name: 'underline',
        level: 'inline',
        start(src) {
          const match = src.match(/\+\+/);
          return match ? match.index : -1;
        },
        tokenizer(src) {
          const match = /^\+\+([^+]+)\+\+/.exec(src);
          if (match) {
            return {
              type: 'underline',
              raw: match[0],
              text: match[1],
              tokens: []
            };
          }
          return undefined;
        },
        renderer(token) {
          return `<u>${token.text}</u>`;
        }
      }]
    });

    marked.use({
      renderer: {
        image(href, title, text) {
          const imageUrl = href.startsWith('/') ? `https://dane.gg${href}` : href;
          return `<img src="${imageUrl}" alt="${text}"${title ? ` title="${title}"` : ''}>`;
        }
      }
    });

    this.feed = new Feed({
      title: "dane 桜",
      description: "I write the words which computers like!",
      id: "https://dane.gg/",
      link: "https://dane.gg/",
      language: "en",
      image: "https://dane.gg/assets/img/misc/social-thumbnail.jpg",
      favicon: "https://dane.gg/assets/favicon/favicon.ico",
      copyright: `© ${new Date().getFullYear()} dane.gg. All rights reserved.`,
      author: {
        name: "Dane Buchanan",
        email: "me@dane.gg",
        link: "https://dane.gg"
      }
    });
  }

  processImageUrl(thumbnail) {
    if (!thumbnail) return undefined;
    return thumbnail.startsWith('http') ? thumbnail : `https://dane.gg${thumbnail}`;
  }

  async generateFeed() {
    try {
      this.feed.items = [];

      const query = `
        SELECT 
          title,
          slug,
          content,
          published_at,
          updated_at,
          thumbnail
        FROM website.posts
        WHERE published = true 
        ORDER BY published_at DESC
        LIMIT 15`;
      
      const { rows: posts } = await pool.query(query);

      if (!posts || posts.length === 0) {
        return this.feed.rss2();
      }

      posts.forEach(post => {
        if (!post.title || !post.slug) {
          console.warn('Skipping invalid post:', post);
          return;
        }

        let parsedContent;
        try {
          parsedContent = marked.parse(post.content || '');
        } catch (markdownError) {
          console.error('Markdown parsing error:', markdownError);
          parsedContent = post.content || '';
        }

        this.feed.addItem({
          title: post.title || 'Untitled',
          id: `https://dane.gg/blog/${post.slug}`,
          link: `https://dane.gg/blog/${post.slug}`,
          description: parsedContent.substring(0, 160),
          content: parsedContent,
          date: new Date(post.published_at || Date.now()),
          published: new Date(post.published_at || Date.now()),
          updated: new Date(post.updated_at || post.published_at || Date.now()),
          image: this.processImageUrl(post.thumbnail)
        });
      });

      return this.feed.rss2();
    } catch (error) {
      console.error('Error generating RSS feed:', error);
      throw new Error(`RSS Feed generation failed: ${error.message}`);
    }
  }
}