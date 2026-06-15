'use client';

import { useState } from 'react';
import { motion as m } from 'framer-motion';

interface SongInfo {
  id: string;
  type: 'song' | 'playlist' | 'album';
}

function parseUrl(url: string): SongInfo | null {
  // 处理 music.163.com/song?id=xxx
  // music.163.com/playlist?id=xxx
  // music.163.com/album?id=xxx
  // music.163.com/#/song?id=xxx
  // 163cn.tv/xxxxx
  
  let cleanUrl = url.trim();
  
  // 匹配 ID
  const idMatch = cleanUrl.match(/[?&]id=(\d+)/);
  if (!idMatch) {
    // 尝试匹配短链接或直接数字
    const directId = cleanUrl.match(/(\d{6,})/);
    if (!directId) return null;
    return { id: directId[1], type: 'song' };
  }

  const id = idMatch[1];
  let type: SongInfo['type'] = 'song';
  if (cleanUrl.includes('playlist')) type = 'playlist';
  else if (cleanUrl.includes('album')) type = 'album';

  return { id, type };
}

function getEmbedUrl(info: SongInfo): string {
  const typeMap = { song: 2, playlist: 3, album: 1 };
  const heightMap = { song: 66, playlist: 340, album: 340 };
  return `//music.163.com/outchain/player?type=${typeMap[info.type]}&id=${info.id}&auto=0&height=${heightMap[info.type]}`;
}

export default function NetEaseMusic() {
  const [url, setUrl] = useState('');
  const [parsed, setParsed] = useState<SongInfo | null>(null);
  const [error, setError] = useState('');

  const handleParse = () => {
    setError('');
    setParsed(null);
    const result = parseUrl(url);
    if (!result) {
      setError('无法解析该链接，请输入正确的网易云音乐链接\n例如：https://music.163.com/song?id=xxx');
      return;
    }
    setParsed(result);
  };

  return (
    <div>
      <div className="glass-heavy rounded-2xl p-6 space-y-4">
        {/* 输入区 */}
        <div>
          <label className="mb-2 block text-sm font-medium">网易云音乐链接</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleParse()}
              placeholder="粘贴网易云音乐链接，如 https://music.163.com/song?id=xxx"
              className="glass flex-1 rounded-xl px-4 py-3 text-sm outline-none placeholder-gray-400 focus:ring-2 focus:ring-accent/50"
            />
            <button onClick={handleParse} className="btn-premium text-sm !px-6 whitespace-nowrap">
              🔍 解析
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-red-500 whitespace-pre-line">{error}</p>
          )}
        </div>

        {/* 解析结果 */}
        {parsed && (
          <m.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="glass-light rounded-full px-2 py-0.5 text-xs">
                {parsed.type === 'song' ? '🎵 单曲' : parsed.type === 'playlist' ? '📋 歌单' : '💿 专辑'}
              </span>
              <span>ID: {parsed.id}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe frameborder="no" marginwidth="0" marginheight="0" width="100%" height="${parsed.type === 'song' ? 66 : 340}" src="https:${getEmbedUrl(parsed)}"></iframe>`);
                }}
                className="ml-auto text-xs text-accent hover:underline"
              >
                📋 复制嵌入代码
              </button>
            </div>

            {/* 嵌入播放器 */}
            <div className="glass rounded-xl overflow-hidden">
              <iframe
                title="网易云音乐"
                frameBorder="no"
                marginWidth={0}
                marginHeight={0}
                width="100%"
                height={parsed.type === 'song' ? 66 : 340}
                src={`https:${getEmbedUrl(parsed)}`}
                className="rounded-xl"
              />
            </div>

            <p className="text-xs text-gray-500">
              💡 提示：你可以点击「复制嵌入代码」将播放器插入到文章里
            </p>
          </m.div>
        )}

        {/* 使用说明 */}
        {!parsed && !error && (
          <div className="text-xs text-gray-400 space-y-1">
            <p>支持的音乐链接格式：</p>
            <p>• https://music.163.com/song?id=xxxx</p>
            <p>• https://music.163.com/playlist?id=xxxx</p>
            <p>• https://music.163.com/album?id=xxxx</p>
            <p>• 直接输入歌曲 ID（纯数字）</p>
          </div>
        )}
      </div>
    </div>
  );
}
