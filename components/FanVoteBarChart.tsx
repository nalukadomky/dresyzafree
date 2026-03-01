'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface Result {
  playerId: string;
  playerName: string;
  voteCount: number;
}

interface Props {
  results: Result[];
  totalVotes: number;
}

export default function FanVoteBarChart({ results, totalVotes }: Props) {
  if (results.length === 0) return null;

  const data = results.map((r) => ({
    name: r.playerName,
    votes: r.voteCount,
    pct: totalVotes > 0 ? Math.round((r.voteCount / totalVotes) * 100) : 0,
  }));

  const maxVotes = Math.max(...data.map((d) => d.votes));

  return (
    <ResponsiveContainer width="100%" height={Math.max(180, results.length * 40)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
      >
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          width={120}
          tick={{ fill: 'var(--color-foreground)', fontSize: 13 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value) => [`${value} hlasů`, 'Hlasů']}
          contentStyle={{
            background: 'var(--color-surface, #1a1a2e)',
            border: '1px solid var(--color-border, rgba(255,255,255,0.1))',
            borderRadius: 8,
            color: 'var(--color-foreground, #fff)',
            fontSize: 13,
          }}
        />
        <Bar dataKey="votes" radius={[0, 6, 6, 0]} barSize={24}>
          {data.map((entry, index) => (
            <Cell
              key={entry.name}
              fill={
                index === 0 && entry.votes === maxVotes
                  ? '#3B82F6'
                  : '#3B82F660'
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
