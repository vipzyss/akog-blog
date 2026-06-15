'use client';

import { useEffect, useState } from 'react';

interface Props {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  pauseDelay?: number;
  className?: string;
}

export default function Typewriter({
  texts,
  speed = 80,
  deleteSpeed = 40,
  pauseDelay = 2000,
  className = '',
}: Props) {
  const [displayText, setDisplayText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];

    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          // 打字阶段
          if (charIndex < currentText.length) {
            setDisplayText(currentText.slice(0, charIndex + 1));
            setCharIndex((prev) => prev + 1);
          } else {
            // 打字完毕，暂停后开始删除
            setTimeout(() => setIsDeleting(true), pauseDelay);
            return;
          }
        } else {
          // 删除阶段
          if (charIndex > 0) {
            setDisplayText(currentText.slice(0, charIndex - 1));
            setCharIndex((prev) => prev - 1);
          } else {
            // 删除完毕，切换到下一句
            setIsDeleting(false);
            setTextIndex((prev) => (prev + 1) % texts.length);
            return;
          }
        }
      },
      isDeleting ? deleteSpeed : speed
    );

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex, texts, speed, deleteSpeed, pauseDelay]);

  return (
    <span className={className}>
      {displayText}
      <span className="inline-block w-[2px] h-[1em] bg-cyan-400 ml-0.5 animate-pulse align-middle" />
    </span>
  );
}
