'use client';

import { useMemo } from 'react';
import { buildHeroNetwork } from './heroNeuralNetwork';

export function HeroNeuralFallback() {
  const { nodes, links } = useMemo(() => {
    const network = buildHeroNetwork();
    const projected = network.nodes.map((point) => ({
      x: 200 + point.x * 72 + point.z * 28,
      y: 200 - point.y * 72 + point.z * 20,
    }));

    const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < network.linkPositions.length; i += 6) {
      const a = {
        x: 200 + network.linkPositions[i] * 72 + network.linkPositions[i + 2] * 28,
        y: 200 - network.linkPositions[i + 1] * 72 + network.linkPositions[i + 2] * 20,
      };
      const b = {
        x: 200 + network.linkPositions[i + 3] * 72 + network.linkPositions[i + 5] * 28,
        y: 200 - network.linkPositions[i + 4] * 72 + network.linkPositions[i + 5] * 20,
      };
      segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
    }

    return { nodes: projected, links: segments };
  }, []);

  return (
    <div className="relative grid h-full w-full place-items-center">
      <div className="absolute size-[58%] rounded-full bg-primary/20 blur-3xl" />
      <svg viewBox="0 0 400 400" className="h-[90%] w-[90%] text-primary" aria-hidden="true">
        <polygon
          points="200,132 258,166 258,234 200,268 142,234 142,166"
          fill="currentColor"
          className="opacity-90"
        />
        <text
          x="200"
          y="192"
          textAnchor="middle"
          className="fill-primary-ink font-heading"
          fontSize="22"
          fontWeight="600"
        >
          Bina
        </text>
        <text
          x="200"
          y="218"
          textAnchor="middle"
          className="fill-primary-ink font-heading"
          fontSize="26"
          fontWeight="700"
        >
          AI
        </text>
        <polygon
          points="200,108 278,154 278,246 200,292 122,246 122,154"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className="opacity-35"
        />
        {links.map((link) => (
          <line
            key={`${link.x1}-${link.y1}-${link.x2}-${link.y2}`}
            x1={link.x1}
            y1={link.y1}
            x2={link.x2}
            y2={link.y2}
            stroke="currentColor"
            strokeWidth="0.8"
            className="opacity-25"
          />
        ))}
        {nodes.map((node) => (
          <circle
            key={`${node.x}-${node.y}`}
            cx={node.x}
            cy={node.y}
            r={2.4}
            fill="currentColor"
            className="opacity-80"
          />
        ))}
      </svg>
    </div>
  );
}
