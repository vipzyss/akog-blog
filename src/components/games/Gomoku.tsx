'use client';

import { useState, useCallback } from 'react';
import { motion as m } from 'framer-motion';

const BOARD_SIZE = 15;
const EMPTY = 0;
const BLACK = 1;
const WHITE = 2;

type Board = number[][];

function initBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(EMPTY));
}

function checkWin(board: Board, row: number, col: number, player: number): boolean {
  const dirs = [[1,0],[0,1],[1,1],[1,-1]];
  return dirs.some(([dx, dy]) => {
    let count = 1;
    for (let sign of [-1, 1]) {
      for (let step = 1; step < 5; step++) {
        const nr = row + dx * step * sign;
        const nc = col + dy * step * sign;
        if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) break;
        if (board[nr][nc] !== player) break;
        count++;
      }
    }
    return count >= 5;
  });
}

export default function Gomoku() {
  const [board, setBoard] = useState<Board>(initBoard);
  const [currentPlayer, setCurrentPlayer] = useState(BLACK);
  const [winner, setWinner] = useState(0);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [history, setHistory] = useState<Board[]>([]);

  const reset = useCallback(() => {
    setBoard(initBoard());
    setCurrentPlayer(BLACK);
    setWinner(0);
    setLastMove(null);
    setHistory([]);
  }, []);

  const undo = () => {
    if (history.length === 0 || winner) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBoard(prev);
    setCurrentPlayer((p) => (p === BLACK ? WHITE : BLACK));
    setLastMove(null);
  };

  const handleClick = (row: number, col: number) => {
    if (board[row][col] !== EMPTY || winner !== 0) return;

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentPlayer;

    setHistory((h) => [...h, board]);
    setBoard(newBoard);
    setLastMove([row, col]);

    if (checkWin(newBoard, row, col, currentPlayer)) {
      setWinner(currentPlayer);
    } else {
      setCurrentPlayer((p) => (p === BLACK ? WHITE : BLACK));
    }
  };

  const getStatusText = () => {
    if (winner === BLACK) return '⚫ 黑棋获胜！';
    if (winner === WHITE) return '⚪ 白棋获胜！';
    return currentPlayer === BLACK ? '⚫ 黑棋落子' : '⚪ 白棋落子';
  };

  return (
    <div>
      {/* 状态栏 */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`glass-light rounded-full px-4 py-1.5 text-sm font-medium ${winner ? 'gradient-text-cyan' : ''}`}>
            {getStatusText()}
          </span>
          {lastMove && !winner && (
            <span className="text-xs text-gray-400">
              ({lastMove[0]}, {lastMove[1]})
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0 || winner !== 0}
            className="glass-light rounded-full px-3 py-1.5 text-xs transition hover:text-accent disabled:opacity-30"
          >
            ↩ 悔棋
          </button>
          <button onClick={reset} className="btn-premium text-sm !px-4 !py-1.5">
            🔄 新游戏
          </button>
        </div>
      </div>

      {/* 棋盘 */}
      <div className="flex justify-center">
        <div className="glass-heavy rounded-2xl p-4 inline-block">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
              width: `${BOARD_SIZE * 32}px`,
            }}
          >
            {board.map((row, r) =>
              row.map((val, c) => (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleClick(r, c)}
                  className="relative flex items-center justify-center"
                  style={{ width: 32, height: 32 }}
                >
                  {/* 棋盘格线 */}
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={32}
                    height={32}
                    viewBox="0 0 32 32"
                  >
                    {r < BOARD_SIZE - 1 && (
                      <line x1={16} y1={16} x2={16} y2={48} stroke="currentColor" strokeWidth={0.5} className="text-gray-400/40" />
                    )}
                    {c < BOARD_SIZE - 1 && (
                      <line x1={16} y1={16} x2={48} y2={16} stroke="currentColor" strokeWidth={0.5} className="text-gray-400/40" />
                    )}
                  </svg>

                  {/* 星位（天元/小目） */}
                  {([3,7,11].includes(r) && [3,7,11].includes(c)) && (
                    <div className="absolute h-2 w-2 rounded-full bg-gray-400/40" />
                  )}

                  {/* 棋子 */}
                  {val !== EMPTY && (
                    <m.div
                      initial={lastMove && lastMove[0] === r && lastMove[1] === c ? { scale: 0 } : undefined}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                      className={`absolute z-10 h-7 w-7 rounded-full shadow-md ${
                        val === BLACK
                          ? 'bg-gradient-to-b from-gray-700 to-gray-900'
                          : 'bg-gradient-to-b from-gray-50 to-gray-200'
                      }`}
                    >
                      {/* 最后一手的标记 */}
                      {lastMove && lastMove[0] === r && lastMove[1] === c && (
                        <div className={`absolute inset-0 flex items-center justify-center`}>
                          <div className={`h-2 w-2 rounded-full ${val === BLACK ? 'bg-white/70' : 'bg-black/50'}`} />
                        </div>
                      )}
                    </m.div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 胜利/平局提示 */}
      {winner !== 0 && (
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 glass-heavy rounded-2xl p-6 text-center"
        >
          <p className="mb-2 text-4xl">🏆</p>
          <p className="mb-1 text-lg font-bold gradient-text-cyan">
            {winner === BLACK ? '⚫ 黑棋' : '⚪ 白棋'}获胜！
          </p>
          <p className="mb-4 text-sm text-gray-400">五子连珠，精彩对局！</p>
          <button onClick={reset} className="btn-premium text-sm">
            🔄 再来一局
          </button>
        </m.div>
      )}
    </div>
  );
}
