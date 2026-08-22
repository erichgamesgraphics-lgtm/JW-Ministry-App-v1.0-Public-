import React from 'react';

interface JWMinistryLogoProps {
  className?: string;
  size?: number | string;
  isAuthenticating?: boolean;
  alt?: string;
}

export const JWMinistryLogo: React.FC<JWMinistryLogoProps> = ({
  className = '',
  size = 48,
  isAuthenticating = false,
  alt = 'JW Ministry App Logo',
}) => {
  const sizePx = typeof size === 'number' ? `${size}px` : size;

  return (
    <div
      style={{ width: sizePx, height: sizePx }}
      className={`relative inline-flex items-center justify-center select-none shrink-0 transition-all duration-300 ${className}`}
    >
      {/* Outer Glow / Ring when authenticating */}
      {isAuthenticating && (
        <div className="absolute -inset-2 rounded-[28px] bg-gradient-to-tr from-blue-500/30 to-indigo-500/30 animate-pulse blur-sm" />
      )}

      {/* Main Logo Container */}
      <div className={`relative h-full w-full overflow-hidden rounded-[22%] shadow-sm ${
        isAuthenticating ? 'ring-2 ring-blue-500/60 ring-offset-2 ring-offset-white dark:ring-offset-[#0B1120] scale-[0.98]' : ''
      }`}>
        <img
          src="/J.png"
          alt={alt}
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/logo.png';
          }}
          className="h-full w-full object-cover select-none pointer-events-none"
        />
      </div>

      {/* Authenticating Spinner Overlay */}
      {isAuthenticating && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px] rounded-[22%]">
          <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};
