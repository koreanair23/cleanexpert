import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const LongTermCareLogo: React.FC<LogoProps> = ({ 
  className = "w-11 h-11", 
  size = 48,
  showText = false
}) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ width: size, height: size }}
      aria-label="노인장기요양보험 지정기관 마크"
    >
      <defs>
        {/* 블루 스타 그라데이션 */}
        <linearGradient id="starGrad" x1="50" y1="20" x2="130" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#29B6F6" />
          <stop offset="40%" stopColor="#0288D1" />
          <stop offset="100%" stopColor="#01579B" />
        </linearGradient>

        {/* 그린 하트 그라데이션 */}
        <linearGradient id="heartGrad" x1="100" y1="70" x2="170" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C0CA33" />
          <stop offset="45%" stopColor="#7CB342" />
          <stop offset="100%" stopColor="#558B2F" />
        </linearGradient>

        {/* 오렌지 태양 그라데이션 */}
        <linearGradient id="orangeGrad" x1="30" y1="50" x2="100" y2="140" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FF9800" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
      </defs>

      {/* 1. 오렌지 태양 광선 및 소용돌이 (좌측) */}
      <g>
        {/* 햇살 라인들 */}
        <path d="M60 52 L52 38" stroke="url(#orangeGrad)" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M78 45 L78 30" stroke="url(#orangeGrad)" strokeWidth="6.5" strokeLinecap="round" />
        <path d="M96 48 L104 36" stroke="url(#orangeGrad)" strokeWidth="6.5" strokeLinecap="round" />

        {/* 나선형 소용돌이 */}
        <path 
          d="M 68 85 
             C 63 76, 75 68, 84 73 
             C 93 78, 92 92, 82 98 
             C 68 106, 52 92, 53 76 
             C 54 55, 78 45, 96 52
             C 107 56, 114 66, 112 78" 
          stroke="url(#orangeGrad)" 
          strokeWidth="7" 
          strokeLinecap="round" 
          fill="none" 
        />
        
        {/* 하단 큰 호 곡선 */}
        <path 
          d="M 40 92 
             C 32 115, 48 142, 75 146 
             C 94 149, 112 140, 122 128" 
          stroke="url(#orangeGrad)" 
          strokeWidth="8" 
          strokeLinecap="round" 
          fill="none" 
        />
      </g>

      {/* 2. 메인 푸른 별 (상단 중앙) */}
      <g transform="rotate(-6 112 68)">
        {/* 별 외곽 광채 테두리 */}
        <path 
          d="M 112 24 
             L 125 48 
             L 152 53 
             L 133 73 
             L 137 100 
             L 112 88 
             L 87 100 
             L 91 73 
             L 72 53 
             L 99 48 Z" 
          fill="none" 
          stroke="#0288D1" 
          strokeWidth="9" 
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* 별 채우기 */}
        <path 
          d="M 112 26 
             L 124 49 
             L 150 54 
             L 131 73 
             L 135 98 
             L 112 86 
             L 89 98 
             L 93 73 
             L 74 54 
             L 100 49 Z" 
          fill="url(#starGrad)" 
          stroke="#ffffff" 
          strokeWidth="3.5" 
          strokeLinejoin="round" 
        />
      </g>

      {/* 3. 연두/녹색 하트 (우측 하단) */}
      <g>
        {/* 하트 외곽 진한 녹색 테두리 */}
        <path 
          d="M 148 76 
             C 176 74, 188 108, 172 136 
             C 158 158, 128 168, 102 146 
             C 86 132, 90 106, 114 96 
             C 128 90, 138 98, 148 76 Z" 
          fill="none" 
          stroke="#33691E" 
          strokeWidth="9" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        />
        {/* 하트 흰색 분리 테두리 */}
        <path 
          d="M 148 78 
             C 174 76, 185 107, 170 134 
             C 156 155, 128 164, 104 144 
             C 89 131, 93 107, 115 98 
             C 128 92, 138 99, 148 78 Z" 
          fill="url(#heartGrad)" 
          stroke="#ffffff" 
          strokeWidth="4" 
          strokeLinejoin="round"
        />
      </g>

      {showText && (
        <text 
          x="100" 
          y="190" 
          textAnchor="middle" 
          fill="#005BAC" 
          fontWeight="900" 
          fontSize="19" 
          letterSpacing="-0.8px"
          fontFamily="system-ui, -apple-system, 'Noto Sans KR', sans-serif"
        >
          노인장기요양보험
        </text>
      )}
    </svg>
  );
};
