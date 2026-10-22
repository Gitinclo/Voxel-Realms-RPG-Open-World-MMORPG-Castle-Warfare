/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClanEmblem } from '../types/game';

interface ClanEmblemViewProps {
  emblem: ClanEmblem;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showGlow?: boolean;
}

const SIZE_MAP = {
  xs: { w: 28, h: 28, iconSize: 14, stroke: 1.5 },
  sm: { w: 40, h: 40, iconSize: 18, stroke: 2 },
  md: { w: 56, h: 56, iconSize: 26, stroke: 2.5 },
  lg: { w: 84, h: 84, iconSize: 38, stroke: 3 },
  xl: { w: 120, h: 120, iconSize: 54, stroke: 4 },
};

const SIGIL_ICONS: Record<ClanEmblem['sigil'], string> = {
  dragon: '🐉',
  crown: '👑',
  swords: '⚔️',
  phoenix: '🔥',
  wolf: '🐺',
  lion: '🦁',
  skull: '💀',
  lightning: '⚡',
  citadel: '🏰',
  gryphon: '🦅',
};

export const ClanEmblemView: React.FC<ClanEmblemViewProps> = ({
  emblem,
  size = 'md',
  className = '',
  showGlow = false,
}) => {
  const { w, h, iconSize, stroke } = SIZE_MAP[size];
  const gradId = `emblem-grad-${emblem.shape}-${emblem.primaryColor.replace('#', '')}-${emblem.secondaryColor.replace('#', '')}-${size}`;
  const filterId = `emblem-glow-${size}`;

  // SVG Shapes normalized to 100x100 coordinate space
  const getShapePath = () => {
    switch (emblem.shape) {
      case 'shield':
        return 'M 15 10 L 85 10 Q 85 55 50 92 Q 15 55 15 10 Z';
      case 'diamond':
        return 'M 50 6 L 94 50 L 50 94 L 6 50 Z';
      case 'crest':
        return 'M 12 18 Q 50 4 88 18 L 82 62 Q 50 96 18 62 Z';
      case 'roundel':
        return 'M 50 8 A 42 42 0 1 0 50 92 A 42 42 0 1 0 50 8 Z';
      case 'banner':
        return 'M 14 8 L 86 8 L 86 88 L 50 72 L 14 88 Z';
      case 'octagon':
        return 'M 28 8 L 72 8 L 92 28 L 92 72 L 72 92 L 28 92 L 8 72 L 8 28 Z';
      default:
        return 'M 15 10 L 85 10 Q 85 55 50 92 Q 15 55 15 10 Z';
    }
  };

  const getBorderDash = () => {
    switch (emblem.borderStyle) {
      case 'runed_iron':
        return '4 2';
      case 'spiked_bronze':
        return '6 2 2 2';
      case 'star_silver':
        return 'none';
      case 'gold_filigree':
      default:
        return 'none';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: w, height: h }}
    >
      <svg
        viewBox="0 0 100 100"
        width={w}
        height={h}
        className={`overflow-visible transition-transform duration-200 ${
          showGlow ? 'drop-shadow-[0_0_12px_rgba(234,179,8,0.45)]' : ''
        }`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={emblem.primaryColor} />
            <stop offset="100%" stopColor={emblem.secondaryColor} />
          </linearGradient>

          {showGlow && (
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          )}
        </defs>

        {/* Heraldic Background Base */}
        <path
          d={getShapePath()}
          fill={`url(#${gradId})`}
          stroke={emblem.borderColor}
          strokeWidth={stroke * 2.5}
          strokeDasharray={getBorderDash()}
          strokeLinejoin="round"
          className="transition-colors duration-300"
        />

        {/* Inner Engraved Trim */}
        <path
          d={getShapePath()}
          fill="none"
          stroke="rgba(255, 255, 255, 0.25)"
          strokeWidth="1.2"
          transform="scale(0.86) translate(8, 8)"
          strokeLinejoin="round"
        />
      </svg>

      {/* Heraldic Sigil Overlay */}
      <span
        className="absolute pointer-events-none select-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] flex items-center justify-center"
        style={{
          fontSize: `${iconSize}px`,
          lineHeight: 1,
        }}
      >
        {SIGIL_ICONS[emblem.sigil] || '🛡️'}
      </span>
    </div>
  );
};
