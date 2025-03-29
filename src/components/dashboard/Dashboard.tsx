import React from 'react';
import { Box, Typography, Grid, Card, CardContent } from '@mui/material';
import {
  Assignment as ProjectsIcon,
  Task as TasksIcon,
  Receipt as ExpensesIcon,
  Gavel as BidsIcon,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const stats = [
    { title: 'Active Projects', value: '5', icon: <ProjectsIcon />, color: '#2196f3' },
    { title: 'Pending Tasks', value: '12', icon: <TasksIcon />, color: '#f50057' },
    { title: 'Total Expenses', value: '$45,000', icon: <ExpensesIcon />, color: '#4caf50' },
    { title: 'Open Bids', value: '3', icon: <BidsIcon />, color: '#ff9800' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.title}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box
                    sx={{
                      backgroundColor: `${stat.color}20`,
                      borderRadius: '50%',
                      p: 1,
                      mr: 2,
                    }}
                  >
                    {React.cloneElement(stat.icon as React.ReactElement, {
                      sx: { color: stat.color },
                    })}
                  </Box>
                  <Typography variant="h6" component="div">
                    {stat.title}
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 