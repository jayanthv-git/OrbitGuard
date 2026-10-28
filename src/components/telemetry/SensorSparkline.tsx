import React from 'react';

interface SensorSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  min?: number;
  max?: number;
  isAnomaly?: boolean;
}

export const SensorSparkline: React.FC<SensorSparklineProps> = ({
  data,
  color = '#d97742',
  height = 24,
  width = 96,
  min: customMin,
  max: customMax,
  isAnomaly = false
}) => {
  if (!data || data.length < 2) {
    return <div style={{ width, height }} className="bg-[#181e28] rounded animate-pulse" />;
  }

  const min = customMin !== undefined ? customMin : Math.min(...data);
  const max = customMax !== undefined ? customMax : Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const strokeColor = isAnomaly ? '#f43f5e' : color;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {/* Current point indicator */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * (height - 6) - 3}
          r={2.5}
          fill={strokeColor}
        />
      )}
    </svg>
  );
};
