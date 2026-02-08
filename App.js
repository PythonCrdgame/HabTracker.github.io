import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  AppBar, 
  Toolbar, 
  Box, 
  Grid, 
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Card,
  CardContent,
  CardActions,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack
} from '@mui/material';
import { 
  Add as AddIcon, 
  Check as CheckIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  LocalFireDepartment as FireIcon,
  Whatshot as WhatshotIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function App() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [todayStatus, setTodayStatus] = useState([]);

  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily',
    color: '#3b82f6'
  });

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(new Date()), i));

  useEffect(() => {
    fetchHabits();
    fetchTodayStatus();
  }, []);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/habits`);
      setHabits(response.data);
    } catch (error) {
      console.error('Error fetching habits:', error);
      showSnackbar('Error fetching habits', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/habits/today/status`);
      setTodayStatus(response.data);
    } catch (error) {
      console.error('Error fetching today status:', error);
    }
  };

  const handleAddHabit = async () => {
    try {
      await axios.post(`${API_URL}/habits`, newHabit);
      setOpenDialog(false);
      setNewHabit({ name: '', description: '', frequency: 'daily', color: '#3b82f6' });
      fetchHabits();
      fetchTodayStatus();
      showSnackbar('Habit added successfully!', 'success');
    } catch (error) {
      showSnackbar('Error adding habit', 'error');
    }
  };

  const handleUpdateHabit = async () => {
    try {
      await axios.put(`${API_URL}/habits/${editingHabit._id}`, editingHabit);
      setOpenEditDialog(false);
      setEditingHabit(null);
      fetchHabits();
      showSnackbar('Habit updated successfully!', 'success');
    } catch (error) {
      showSnackbar('Error updating habit', 'error');
    }
  };

  const handleDeleteHabit = async (id) => {
    if (window.confirm('Are you sure you want to delete this habit?')) {
      try {
        await axios.delete(`${API_URL}/habits/${id}`);
        fetchHabits();
        fetchTodayStatus();
        showSnackbar('Habit deleted successfully!', 'success');
      } catch (error) {
        showSnackbar('Error deleting habit', 'error');
      }
    }
  };

  const handleTrackHabit = async (habitId, status) => {
    try {
      const date = format(selectedDate, 'yyyy-MM-dd');
      await axios.put(`${API_URL}/habits/${habitId}/track`, { date, status });
      fetchHabits();
      fetchTodayStatus();
      showSnackbar('Progress updated!', 'success');
    } catch (error) {
      showSnackbar('Error updating progress', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getStatusForDate = (habit, date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const entry = habit.completedDates.find(d => d.date === dateString);
    return entry ? entry.status : 'none';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'skipped': return '#ef4444';
      default: return '#d1d5db';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <FireIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Habit Tracker
          </Typography>
          <Button 
            color="inherit" 
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Add Habit
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Date Selector */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Select Date: {format(selectedDate, 'MMMM dd, yyyy')}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
            {weekDays.map((day) => (
              <Button
                key={day.toString()}
                variant={isSameDay(day, selectedDate) ? "contained" : "outlined"}
                onClick={() => setSelectedDate(day)}
                sx={{ minWidth: 'auto' }}
              >
                {format(day, 'EEE')}
                <br />
                {format(day, 'd')}
              </Button>
            ))}
          </Stack>
        </Box>

        {/* Today's Overview */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Today's Progress
          </Typography>
          <Grid container spacing={2}>
            {todayStatus.map((habit) => (
              <Grid item xs={12} sm={6} md={4} key={habit._id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" component="div">
                        {habit.name}
                      </Typography>
                      <Chip 
                        icon={<WhatshotIcon />} 
                        label={`${habit.streak} day${habit.streak !== 1 ? 's' : ''}`}
                        color="warning"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Current streak
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      variant={habit.status === 'completed' ? 'contained' : 'outlined'}
                      color="success"
                      startIcon={<CheckIcon />}
                      onClick={() => handleTrackHabit(habit._id, 'completed')}
                      disabled={!isSameDay(selectedDate, new Date())}
                    >
                      Complete
                    </Button>
                    <Button
                      size="small"
                      variant={habit.status === 'skipped' ? 'contained' : 'outlined'}
                      color="error"
                      startIcon={<CloseIcon />}
                      onClick={() => handleTrackHabit(habit._id, 'skipped')}
                      disabled={!isSameDay(selectedDate, new Date())}
                    >
                      Skip
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* All Habits */}
        <Typography variant="h5" gutterBottom>
          All Habits
        </Typography>
        <Grid container spacing={3}>
          {habits.map((habit) => (
            <Grid item xs={12} md={6} lg={4} key={habit._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6" component="div">
                        {habit.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {habit.description}
                      </Typography>
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => {
                        setEditingHabit(habit);
                        setOpenEditDialog(true);
                      }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteHabit(habit._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1}>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#f3f4f6' }}>
                          <Typography variant="body2" color="text.secondary">
                            Current Streak
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="center">
                            <FireIcon sx={{ color: '#f59e0b', mr: 0.5 }} />
                            <Typography variant="h6">
                              {habit.streak}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                      <Grid item xs={6}>
                        <Paper elevation={0} sx={{ p: 1, textAlign: 'center', bgcolor: '#f3f4f6' }}>
                          <Typography variant="body2" color="text.secondary">
                            Best Streak
                          </Typography>
                          <Box display="flex" alignItems="center" justifyContent="center">
                            <WhatshotIcon sx={{ color: '#dc2626', mr: 0.5 }} />
                            <Typography variant="h6">
                              {habit.bestStreak}
                            </Typography>
                          </Box>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Weekly Tracker */}
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      This Week
                    </Typography>
                    <Box display="flex" justifyContent="space-between">
                      {weekDays.map((day) => {
                        const status = getStatusForDate(habit, day);
                        return (
                          <Box
                            key={day.toString()}
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: getStatusColor(status),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              setSelectedDate(day);
                              if (isSameDay(day, new Date())) {
                                const nextStatus = status === 'completed' ? 'skipped' : 
                                                 status === 'skipped' ? 'none' : 'completed';
                                handleTrackHabit(habit._id, nextStatus);
                              }
                            }}
                          >
                            {status === 'completed' && <CheckIcon sx={{ color: 'white', fontSize: 16 }} />}
                            {status === 'skipped' && <CloseIcon sx={{ color: 'white', fontSize: 16 }} />}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Empty State */}
        {habits.length === 0 && (
          <Box textAlign="center" py={8}>
            <FireIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No habits yet
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Start building your habits by adding your first one!
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenDialog(true)}
            >
              Add Your First Habit
            </Button>
          </Box>
        )}
      </Container>

      {/* Add Habit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add New Habit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Habit Name"
            fullWidth
            value={newHabit.name}
            onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={newHabit.description}
            onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Frequency</InputLabel>
            <Select
              value={newHabit.frequency}
              label="Frequency"
              onChange={(e) => setNewHabit({ ...newHabit, frequency: e.target.value })}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="custom">Custom</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            value={newHabit.color}
            onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleAddHabit} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Habit Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Habit</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Habit Name"
            fullWidth
            value={editingHabit?.name || ''}
            onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={2}
            value={editingHabit?.description || ''}
            onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateHabit} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default App;