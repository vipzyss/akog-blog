'use client';

import { useState, useCallback } from 'react';
import { motion as m } from 'framer-motion';

// 预置数独题目 (9x9, 0 = 空格)
const PUZZLES = [
  {
    puzzle: [
      [5,3,0,0,7,0,0,0,0],
      [6,0,0,1,9,5,0,0,0],
      [0,9,8,0,0,0,0,6,0],
      [8,0,0,0,6,0,0,0,3],
      [4,0,0,8,0,3,0,0,1],
      [7,0,0,0,2,0,0,0,6],
      [0,6,0,0,0,0,2,8,0],
      [0,0,0,4,1,9,0,0,5],
      [0,0,0,0,8,0,0,7,9],
    ],
    solution: [
      [5,3,4,6,7,8,9,1,2],
      [6,7,2,1,9,5,3,4,8],
      [1,9,8,3,4,2,5,6,7],
      [8,5,9,7,6,1,4,2,3],
      [4,2,6,8,5,3,7,9,1],
      [7,1,3,9,2,4,8,5,6],
      [9,6,1,5,3,7,2,8,4],
      [2,8,7,4,1,9,6,3,5],
      [3,4,5,2,8,6,1,7,9],
    ],
  },
  {
    puzzle: [
      [0,0,0,2,6,0,7,0,1],
      [6,8,0,0,7,0,0,9,0],
      [1,9,0,0,0,4,5,0,0],
      [8,2,0,1,0,0,0,4,0],
      [0,0,4,6,0,2,9,0,0],
      [0,5,0,0,0,3,0,2,8],
      [0,0,9,3,0,0,0,7,4],
      [0,4,0,0,5,0,0,3,6],
      [7,0,3,0,1,8,0,0,0],
    ],
    solution: [
      [4,3,5,2,6,9,7,8,1],
      [6,8,2,5,7,1,4,9,3],
      [1,9,7,8,3,4,5,6,2],
      [8,2,6,1,9,5,3,4,7],
      [3,7,4,6,8,2,9,1,5],
      [9,5,1,7,4,3,6,2,8],
      [5,1,9,3,2,6,8,7,4],
      [2,4,8,9,5,7,1,3,6],
      [7,6,3,4,1,8,2,5,9],
    ],
  },
];

export default function Sudoku() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const puzzle = PUZZLES[puzzleIndex];
  const [grid, setGrid] = useState<number[][]>(puzzle.puzzle.map((row) => [...row]));
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [completed, setCompleted] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Set<string>>(new Set()); // "r,c"

  const reset = useCallback(() => {
    const p = PUZZLES[puzzleIndex];
    setGrid(p.puzzle.map((row) => [...row]));
    setSelected(null);
    setCompleted(false);
    setMessage('');
    setErrors(new Set());
  }, [puzzleIndex]);

  const changePuzzle = (idx: number) => {
    setPuzzleIndex(idx);
    setTimeout(() => reset(), 0);
  };

  const handleCellClick = (r: number, c: number) => {
    // 只允许点击空格或非初始数字
    setSelected([r, c]);
  };

  const handleNumber = (num: number) => {
    if (!selected || completed) return;
    const [r, c] = selected;
    if (puzzle.puzzle[r][c] !== 0) return; // 初始数字不可修改

    const newGrid = grid.map((row) => [...row]);
    newGrid[r][c] = num;
    setGrid(newGrid);

    // 检查是否正确
    const newErrors = new Set(errors);
    if (num !== puzzle.solution[r][c]) {
      newErrors.add(`${r},${c}`);
      setMessage('');
    } else {
      newErrors.delete(`${r},${c}`);
      // 检查是否全部完成
      const correct = newGrid.every((row, ri) =>
        row.every((val, ci) => val === puzzle.solution[ri][ci])
      );
      if (correct) {
        setCompleted(true);
        setMessage('🎉 恭喜完成！');
      } else {
        setMessage('✅ 正确！继续加油');
      }
    }
    setErrors(newErrors);
  };

  const isInitial = (r: number, c: number) => puzzle.puzzle[r][c] !== 0;

  return (
    <div>
      {/* 工具栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          {PUZZLES.map((_, i) => (
            <button
              key={i}
              onClick={() => changePuzzle(i)}
              className={`glass-light rounded-full px-3 py-1 text-xs transition ${
                puzzleIndex === i ? 'bg-accent text-white' : 'hover:text-accent'
              }`}
            >
              第 {i + 1} 关
            </button>
          ))}
        </div>
        <button onClick={reset} className="btn-premium text-sm !px-4 !py-2">
          🔄 重置
        </button>
      </div>

      {/* 消息 */}
      {message && (
        <m.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-center text-sm"
        >
          {message}
        </m.p>
      )}

      {/* 数独盘 */}
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-9 gap-[1px] rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-cyan-500/20">
          {grid.map((row, r) =>
            row.map((val, c) => {
              const key = `${r},${c}`;
              const isSelected = selected && selected[0] === r && selected[1] === c;
              const isError = errors.has(key);
              const isInitialCell = isInitial(r, c);
              const isSameRow = selected && selected[0] === r;
              const isSameCol = selected && selected[1] === c;

              // 3x3 宫格边框
              const borderRight = (c + 1) % 3 === 0 && c < 8 ? 'border-r-2 border-cyan-500/40' : '';
              const borderBottom = (r + 1) % 3 === 0 && r < 8 ? 'border-b-2 border-cyan-500/40' : '';

              return (
                <button
                  key={key}
                  onClick={() => handleCellClick(r, c)}
                  className={`aspect-square flex items-center justify-center text-lg font-bold transition-all duration-150 
                    ${borderRight} ${borderBottom}
                    ${isSelected
                      ? 'bg-cyan-500/30'
                      : isError
                        ? 'bg-red-500/20'
                        : isSameRow || isSameCol
                          ? 'bg-cyan-500/10'
                          : 'bg-white/5 dark:bg-white/[0.03]'
                    }
                    hover:bg-cyan-500/20
                    ${isInitialCell ? 'text-foreground font-extrabold' : isError ? 'text-red-500' : 'text-cyan-400'}
                  `}
                >
                  {val !== 0 ? val : ''}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 数字键盘 */}
      {selected && !isInitial(selected[0], selected[1]) && !completed && (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex justify-center gap-2"
        >
          {[1,2,3,4,5,6,7,8,9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumber(num)}
              className="glass-light h-10 w-10 rounded-xl text-lg font-bold transition hover:bg-accent/30 hover:text-accent"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleNumber(0)}
            className="glass-light h-10 w-10 rounded-xl text-lg transition hover:bg-red-500/20 hover:text-red-500"
          >
            ✕
          </button>
        </m.div>
      )}

      {/* 完成弹窗 */}
      {completed && (
        <m.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-6 glass-heavy rounded-2xl p-6 text-center"
        >
          <p className="mb-2 text-4xl">🏆</p>
          <p className="mb-1 text-lg font-bold gradient-text-cyan">恭喜通关！</p>
          <p className="mb-4 text-sm text-gray-400">数独完成！太厉害了！</p>
          <button onClick={reset} className="btn-premium text-sm">
            🔄 重新挑战
          </button>
          {puzzleIndex < PUZZLES.length - 1 && (
            <button onClick={() => changePuzzle(puzzleIndex + 1)} className="ml-3 glass-light rounded-full px-4 py-2 text-sm hover:text-accent">
              下一关 →
            </button>
          )}
        </m.div>
      )}
    </div>
  );
}
