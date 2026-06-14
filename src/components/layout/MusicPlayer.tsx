'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion as m, AnimatePresence } from 'framer-motion';

interface Track {
  name: string;
  title: string;
  url: string;
}

export default function MusicPlayer() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // 可拖拽位置状态
  const [pos, setPos] = useState({ x: 24, y: 0 });
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // 加载歌曲列表
  useEffect(() => {
    fetch('/api/music')
      .then((r) => r.json())
      .then((data: Track[]) => {
        setTracks(data);
        setLoaded(true);
      })
      .catch(() => {});
  }, []);

  // 初始 y 位置：页面垂直居中
  useEffect(() => {
    if (loaded && typeof window !== 'undefined') {
      setPos(prev => ({ ...prev, y: Math.max(60, window.innerHeight / 2 - 150) }));
    }
  }, [loaded]);

  // 拖拽处理 — 仅从拖拽手柄触发
  useEffect(() => {
    const handle = handleRef.current;
    if (!handle) return;

    const onDown = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      dragState.current = {
        isDragging: true,
        startX: clientX,
        startY: clientY,
        startPosX: posRef.current.x,
        startPosY: posRef.current.y,
      };
      document.body.style.userSelect = 'none';
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragState.current.isDragging) return;
      e.preventDefault();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const ds = dragState.current;
      setPos({
        x: ds.startPosX + (clientX - ds.startX),
        y: Math.max(60, Math.min(window.innerHeight - 370, ds.startPosY + (clientY - ds.startY))),
      });
    };

    const onUp = () => {
      if (!dragState.current.isDragging) return;
      dragState.current.isDragging = false;
      document.body.style.userSelect = '';
      const currentX = posRef.current.x;
      const snapLeft = currentX < window.innerWidth / 2;
      setPos(prev => ({ ...prev, x: snapLeft ? 24 : -24 }));
    };

    handle.addEventListener('mousedown', onDown);
    handle.addEventListener('touchstart', onDown, { passive: false });
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);

    return () => {
      handle.removeEventListener('mousedown', onDown);
      handle.removeEventListener('touchstart', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
      document.body.style.userSelect = '';
    };
  }, []);

  // 始终渲染（即使无音乐也显示空状态）
  const current = tracks[currentIdx] || null;

  // 切歌
  const playIndex = useCallback((idx: number) => {
    if (idx < 0 || idx >= tracks.length) return;
    setCurrentIdx(idx);
    setPlaying(true);
  }, [tracks.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current) return;

    audio.src = current.url;
    audio.volume = volume;
    if (playing) audio.play().catch(() => setPlaying(false));

    const onTime = () => setProgress(audio.currentTime);
    const onLoaded = () => setDuration(audio.duration);
    const onEnd = () => {
      if (currentIdx < tracks.length - 1) {
        playIndex(currentIdx + 1);
      } else {
        setPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('ended', onEnd);
    };
  }, [current, currentIdx, playIndex, tracks.length, volume]);

  // 播放/暂停切换
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [playing]);

  const togglePlay = () => {
    if (!current) return;
    setPlaying(!playing);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    if (audioRef.current && duration) {
      audioRef.current.currentTime = pct * duration;
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <audio
        ref={audioRef}
        preload="metadata"
        onError={() => setPlaying(false)}
      />

      {/* 浮动播放器 */}
      <m.div
        ref={playerRef}
        initial={false}
        animate={{ x: pos.x, y: pos.y }}
        transition={{ type: 'spring', stiffness: 200, damping: 25, mass: 0.8 }}
        className="fixed z-50 select-none"
        style={{ left: 0, top: 0 }}
      >
        <div className="flex items-stretch">
          {/* 拖拽手柄 */}
          <div
            ref={handleRef}
            className="flex cursor-grab items-center justify-center rounded-l-2xl bg-accent/10 px-1.5 transition hover:bg-accent/20 active:cursor-grabbing"
            title="拖拽移动"
          >
            <div className="flex flex-col gap-[3px]">
              {[0, 1, 2].map(i => (
                <div key={i} className="flex gap-[3px]">
                  <div className="h-[3px] w-[3px] rounded-full bg-accent/40" />
                  <div className="h-[3px] w-[3px] rounded-full bg-accent/40" />
                </div>
              ))}
            </div>
          </div>

          {/* 主内容 */}
          <div className="glass-heavy rounded-r-2xl border-2 border-l-0 border-accent/30 p-3 shadow-xl shadow-accent/10 backdrop-blur-xl"
            style={{ width: expanded ? 320 : 220 }}>
        {/* 迷你模式 */}
        {!expanded && (
          <div className="flex items-center gap-3">
            {/* 播放按钮 */}
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent transition hover:bg-accent/30"
            >
              {playing ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>

            {/* 歌曲信息 */}
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpanded(true)}>
              <p className="truncate text-xs font-medium">{current?.title || '无音乐'}</p>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10" onClick={seek}>
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
              </div>
            </div>

            {/* 展开按钮 */}
            <button
              onClick={() => setExpanded(true)}
              className="flex-shrink-0 text-xs text-gray-400 hover:text-accent"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6,9 12,15 18,9"/></svg>
            </button>
          </div>
        )}

        {/* 展开模式 */}
        <AnimatePresence>
          {expanded && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                {/* 标题行 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-accent">🎵 音乐播放器</span>
                  <button onClick={() => setExpanded(false)} className="text-xs text-gray-400 hover:text-accent">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><polyline points="6,15 12,9 18,15"/></svg>
                  </button>
                </div>

                {/* 当前歌曲 */}
                <p className="truncate text-sm font-medium">{current?.title || '无音乐'}</p>

                {/* 进度条 */}
                <div>
                  <div className="h-1.5 cursor-pointer overflow-hidden rounded-full bg-white/10" onClick={seek}>
                    <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>{formatTime(progress)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* 控制按钮 */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => playIndex(currentIdx - 1)}
                    disabled={currentIdx === 0}
                    className="text-gray-400 hover:text-accent disabled:opacity-30"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><polygon points="19,20 9,12 19,4"/><rect x="6.5" y="5" width="4" height="14"/></svg>
                  </button>

                  <button
                    onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20 text-accent transition hover:bg-accent/30"
                  >
                    {playing ? (
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                    ) : (
                      <svg className="ml-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>
                    )}
                  </button>

                  <button
                    onClick={() => playIndex(currentIdx + 1)}
                    disabled={currentIdx === tracks.length - 1}
                    className="text-gray-400 hover:text-accent disabled:opacity-30"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><polygon points="5,4 15,12 5,20"/><rect x="13.5" y="5" width="4" height="14"/></svg>
                  </button>
                </div>

                {/* 音量 */}
                <div className="flex items-center gap-2">
                  <svg className="h-3.5 w-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
                  </svg>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/10 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent"
                  />
                </div>

                {/* 播放列表 */}
                <div className="max-h-28 space-y-0.5 overflow-y-auto">
                  {tracks.map((t, i) => (
                    <button
                      key={`${t.name}-${i}`}
                      onClick={() => playIndex(i)}
                      className={`w-full truncate rounded-lg px-2 py-1 text-left text-xs transition ${
                        i === currentIdx ? 'bg-accent/10 font-medium text-accent' : 'text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      {i + 1}. {t.title}
                    </button>
                  ))}
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
        </div>
        </div>
      </m.div>
    </>
  );
}
