import React from 'react';
import { Box, Typography } from '@mui/material';

export interface GanttData {
  id: string;
  name: string;
  start: Date;
  end: Date;
  color?: string;
  style?: 'primary' | 'secondary' | 'milestone';
}

interface TimelineProps {
  data: GanttData[];
  links?: unknown[];
  scale: {
    start: Date;
    end: Date;
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;

const Timeline: React.FC<TimelineProps> = ({ data, scale }) => {
  const scaleStart = new Date(scale.start);
  const scaleEnd = new Date(scale.end);
  const totalMs = Math.max(scaleEnd.getTime() - scaleStart.getTime(), DAY_MS);

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: 2,
          color: 'text.secondary',
          fontSize: '0.8rem',
        }}
      >
        <Typography variant="caption">
          {scaleStart.toLocaleDateString()}
        </Typography>
        <Typography variant="caption">
          {scaleEnd.toLocaleDateString()}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {data.map((item) => {
          const itemStart = new Date(item.start);
          const rawItemEnd = new Date(item.end);
          const itemEnd =
            rawItemEnd.getTime() >= itemStart.getTime()
              ? rawItemEnd
              : new Date(itemStart.getTime() + DAY_MS);
          const offset =
            ((itemStart.getTime() - scaleStart.getTime()) / totalMs) * 100;
          const span =
            ((itemEnd.getTime() - itemStart.getTime()) / totalMs) * 100;
          const isMilestone = item.style === 'milestone';

          return (
            <Box
              key={item.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '220px 1fr' },
                gap: 1.5,
                alignItems: 'center',
              }}
            >
              <Typography variant="body2" noWrap title={item.name}>
                {item.name}
              </Typography>
              <Box
                sx={{
                  position: 'relative',
                  height: isMilestone ? 16 : 24,
                  bgcolor: 'action.hover',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    left: `${Math.max(0, offset)}%`,
                    top: isMilestone ? 0 : '15%',
                    height: isMilestone ? '100%' : '70%',
                    width: `${Math.max(span, isMilestone ? 1.5 : 3)}%`,
                    minWidth: isMilestone ? 8 : 12,
                    borderRadius: 999,
                    bgcolor: item.color || 'primary.main',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default Timeline;
