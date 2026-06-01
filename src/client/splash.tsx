import './index.css';

import { navigateTo, context, requestExpandedMode } from '@devvit/web/client';
import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { GuessPost, GuessResponse } from '../shared/api';
export const Splash = () => {
  // 1. State for score inputs
  const [homeScore, setHomeScore] = useState<string>('');
  const [awayScore, setAwayScore] = useState<string>('');
  
  // 2. State for the countdown (Example match time: 10 minutes from now)
  // Replace this with your actual target match timestamp fetched from your server/context
  const [targetTime] = useState<number>(Date.parse("2026-06-11T16:00:00Z")); 
  const [timeLeft, setTimeLeft] = useState<number>(targetTime - Date.now());

  useEffect(() => {
    async function loadGuess() {
      const response = await fetch("/api/guess");
      const guess: GuessResponse = await response.json();
      setHomeScore(String(guess.scoreHomeTeam));
      setAwayScore(String(guess.scoreAwayTeam));
    }
    
    loadGuess();
  }, [])

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      const remaining = targetTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime, timeLeft]);

  const isLocked = timeLeft <= 0;

  // 3. Helper to format milliseconds into MM:SS or HH:MM:SS
  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Guesses Locked!';
  
    const totalMinutes = Math.floor(ms / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
  
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
  
    // Build string parts dynamically so it doesn't show "0D:" if it's less than a day away
    const daysStr = days > 0 ? `${days}D:` : '';
    const hoursStr = hours > 0 || days > 0 ? `${hours}H:` : '';
    const minutesStr = `${minutes}Mins`;
  
    return `Locks in: ${daysStr}${hoursStr}${minutesStr}`;
  };

  // 4. Handle prediction submission
  async function handleSubmitPrediction() {
    if (homeScore === '' || awayScore === '') {
      alert('Please enter a prediction for both teams!');
      return;
    }

    // Since this runs in Devvit Webview, you'll eventually use window.parent.postMessage
    // to send this data back to your main Devvit backend.
    const guess: GuessPost = {
      type: 'guess_post',
      scoreHomeTeam: Number(homeScore),
      scoreAwayTeam: Number(awayScore),
    }
    await fetch('/api/guess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        guess
      }),
    });
    alert(`Prediction submitted: Mexico ${homeScore} - ${awayScore} South Africa`);
  };

  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-6 bg-green-400 dark:bg-gray-900 px-4">
      <div className="flex flex-col items-center gap-4 w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl">
        
        {/* NEW HEADER LINE */}
        <span className="text-xs uppercase tracking-widest font-extrabold text-green-600 dark:text-green-400">
          Guess the world cup ⚽
        </span>
  
        <h1 className="text-xl font-bold text-center text-gray-900 dark:text-white mt-[-8px]">
          Hey {context.username ?? 'Prophet'} 👋, guess the correct score!
        </h1>
  
        {/* Timer UI Element */}
        <div className={`text-sm font-semibold px-3 py-1 rounded-full ${isLocked ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
          {formatTime(timeLeft)}
        </div>
  
        {/* Teams and Inputs Layout */}
        <div className="flex flex-row items-center justify-between w-full gap-4 my-2">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1 gap-1">
            <span className="text-4xl" role="img" aria-label="Mexico Flag">🇲🇽</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mexico</span>
          </div>
  
          {/* Inputs */}
          <div className="flex flex-row items-center gap-2">
            <input
              type="number"
              min="0"
              disabled={isLocked}
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 bg-gray-50 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="-"
            />
            <span className="text-xl font-bold text-gray-500">:</span>
            <input
              type="number"
              min="0"
              disabled={isLocked}
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-green-500 bg-gray-50 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              placeholder="-"
            />
          </div>
  
          {/* Away Team */}
          <div className="flex flex-col items-center flex-1 gap-1">
            <span className="text-4xl" role="img" aria-label="South Africa Flag">🇿🇦</span>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">South Africa</span>
          </div>
        </div>
  
        {/* Submit Prediction Button */}
        <button
          onClick={handleSubmitPrediction}
          disabled={isLocked}
          className="w-full mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
        >
          {isLocked ? 'Locked' : 'Submit Prediction'}
        </button>
      </div>
  
      {/* ... remaining footer elements ... */}
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Splash />
  </StrictMode>
);