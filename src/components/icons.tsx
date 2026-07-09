import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  color: string;
  width?: number;
  height?: number;
}

export function BackChevron({ color, width = 9, height = 15 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 10 16" fill="none">
      <Path
        d="M8.5 1.5L1.5 8l7 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function RightChevron({ color, width = 8, height = 14 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 10 16" fill="none">
      <Path
        d="M1.5 1.5L8.5 8l-7 6.5"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function GearIcon({ color, width = 18, height = 18 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PhoneIcon({ color, width = 14, height = 14 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 3c-1.7 0-3 1.3-3 3 0 8.3 6.7 15 15 15 1.7 0 3-1.3 3-3v-2.2c0-.8-.5-1.5-1.3-1.7l-3.8-1.1c-.7-.2-1.4 0-1.9.5l-1.2 1.2c-2-1-3.6-2.6-4.6-4.6l1.2-1.2c.5-.5.7-1.2.5-1.9L8.9 4.3C8.7 3.5 8 3 7.2 3H6z"
        fill={color}
      />
    </Svg>
  );
}

export function CheckIcon({ color, width = 26, height = 26 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 12.5l5 5L20 6"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SunIcon({ color, width = 15, height = 15 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4.5} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MoonIcon({ color, width = 15, height = 15 }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 13.5A8.5 8.5 0 1 1 10.5 4a7 7 0 0 0 9.5 9.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
