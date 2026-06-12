'use client';

import { useState, useEffect } from 'react';

interface FriendLink {
  id: string;
  name: string;
  url: string;
  logo: string;
}

export default function Footer() {
  const [friendLinks, setFriendLinks] = useState<FriendLink[]>([]);

  useEffect(() => {
    fetch('/api/friend-links')
      .then((res) => res.json())
      .then((data) => setFriendLinks(data))
      .catch(() => {});
  }, []);

  return (
    <footer className="glass mt-auto border-t border-white/10 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      <div className="mx-auto max-w-6xl px-6">
        {/* 友情链接 */}
        {friendLinks.length > 0 && (
          <div className="mb-8">
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">友情链接</h4>
            <div className="flex flex-wrap items-center justify-center gap-4">
              {friendLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-light inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm no-underline transition hover:bg-accent/10 hover:text-accent"
                >
                  {link.logo ? (
                    <img src={link.logo} alt={link.name} className="h-5 w-5 rounded object-contain" />
                  ) : (
                    <span className="text-xs">🔗</span>
                  )}
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        )}

        <p>© {new Date().getFullYear()} 瞬云的尽头. 保留所有权利。</p>
      </div>
    </footer>
  );
}
