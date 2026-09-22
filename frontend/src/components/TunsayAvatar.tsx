import React, { useState } from 'react';
import { TunsayState } from '../types';

import lionIdle        from '../assets/lion_idle.png';
import lionEncouraging from '../assets/lion_encouraging.png';
import lionThinking    from '../assets/lion_thinking.png';
import lionExplaining  from '../assets/lion_explaining.png';
import lionCelebrating from '../assets/lion_celebrating.png';

interface TunsayAvatarProps {
  state?: TunsayState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
  onClick?: () => void;
  speechBubbleText?: string;
}

const STATE_IMAGE: Record<string, string> = {
  idle:        lionIdle,
  thinking:    lionThinking,
  celebrating: lionCelebrating,
  explaining:  lionExplaining,
  encouraging: lionEncouraging,
};

const STATE_ANIM: Record<string, string> = {
  idle:        'animate-lion-idle',
  thinking:    'animate-lion-think',
  celebrating: 'animate-lion-celebrate',
  explaining:  'animate-lion-nod',
  encouraging: 'animate-lion-wave',
};

export const TunsayAvatar: React.FC<TunsayAvatarProps> = ({
  state = 'idle',
  size = 'md',
  showBadge = true,
  className = '',
  onClick,
  speechBubbleText
}) => {
  const [isShaking, setIsShaking] = useState(false);

  const dimensions = {
    sm: 'w-10 h-10 sm:w-12 sm:h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32',
    xl: 'w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44',
  }[size];

  const handleClick = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 700);
    if (onClick) onClick();
  };

  const imgSrc   = STATE_IMAGE[state] ?? lionIdle;
  const animCls  = isShaking ? 'animate-lion-shake' : (STATE_ANIM[state] ?? 'animate-lion-idle');

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>

      {/* Speech bubble */}
      {speechBubbleText && (
        <div className="absolute -top-12 bg-white text-[#2E2A26] px-3 py-1.5 rounded-2xl shadow-md border-2 border-[#4C9A6A]/20 text-xs sm:text-sm font-semibold whitespace-nowrap animate-bounce z-20">
          {speechBubbleText}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
        </div>
      )}

      {/* Lion image — swaps per state */}
      <div
        onClick={handleClick}
        className={`${dimensions} cursor-pointer relative`}
        title="Tap Tunsay!"
      >
        <img
          key={state}
          src={imgSrc}
          alt={`Tunsay - ${state}`}
          className={`w-full h-full object-contain drop-shadow-lg transition-opacity duration-300 ${animCls}`}
          draggable={false}
        />
      </div>

      {/* Badge */}
      {showBadge && (
        <span className="mt-1 px-2 py-0.5 bg-[#4C9A6A]/10 text-[#357A4E] text-[11px] font-extrabold rounded-full tracking-wide uppercase border border-[#4C9A6A]/20">
          {state === 'thinking' ? 'Thinking...' : 'Tunsay WEG'}
        </span>
      )}
    </div>
  );
};
