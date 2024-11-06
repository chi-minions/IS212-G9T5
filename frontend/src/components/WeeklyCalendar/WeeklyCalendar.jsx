// WeeklyCalendar.jsx
import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableFooter,
  Paper, Button, TextField, IconButton, InputAdornment, Box, Drawer, List, ListItem, ListItemText,
  Typography
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SearchIcon from '@mui/icons-material/Search';
import Card from '@mui/material/Card';
import './WeeklyCalendar.css';

const WeeklyCalendar = ({ 
  scheduleData, 
  isLoading, 
  error, 
  onWeekChange,
  initialStartDate 
}) => {
  console.log(scheduleData); // Debug log
  // Calculate date limits using dayjs instead of date-fns
  const today = dayjs();
  const minDate = today.subtract(2, 'month');
  const maxDate = today.add(3, 'month');

  const [selectedWeekStart, setSelectedWeekStart] = useState(() => {
    return initialStartDate ? dayjs(initialStartDate) : dayjs().startOf('week');
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedStaffId, setHighlightedStaffId] = useState(null);

  const shifts = [
    { name: 'AM', time: '9:00 - 13:00' },
    { name: 'PM', time: '14:00 - 18:00' }
  ];

  // Search functionality
  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    
    if (newSearchTerm.trim() === '') {
      setHighlightedStaffId(null);
    } else if (scheduleData?.team) {
      const foundStaff = scheduleData.team.find(staff => 
        staff.fullName.toLowerCase().includes(newSearchTerm.toLowerCase()) ||
        staff.staffID.toString().includes(newSearchTerm)
      );
      setHighlightedStaffId(foundStaff ? foundStaff.staffID : null);
    }
  };

  const isHighlightedStaffAtHome = (date, shift) => {
    if (!highlightedStaffId || !scheduleData?.team) return false;
    const staff = scheduleData.team.find(s => s.staffID === highlightedStaffId);
    if (!staff) return false;
    const dateString = date.format('YYYY-MM-DD');
    const scheduleItem = staff.scheduleTrails.find(item => item.date === dateString);
    if (!scheduleItem) return false;
    return shift === 'AM' ? scheduleItem.is_am : scheduleItem.is_pm;
  };

  // Navigation handlers
  const isBackwardDisabled = () => {
    // Get the first day of current week
    const firstDayOfWeek = selectedWeekStart;
    // Check if any day in the current week is before or equal to minDate
    return firstDayOfWeek.isSame(minDate, 'day') || firstDayOfWeek.isBefore(minDate);
  };

  const isForwardDisabled = () => {
    // Get the last day of current week
    const lastDayOfWeek = selectedWeekStart.add(6, 'day');
    // Check if any day in the current week is after or equal to maxDate
    return lastDayOfWeek.isSame(maxDate, 'day') || lastDayOfWeek.isAfter(maxDate);
  };

  const handlePrevWeek = () => {
    if (isBackwardDisabled()) return;
    
    const newWeekStart = selectedWeekStart.subtract(1, 'week');
    setSelectedWeekStart(newWeekStart);
    if (onWeekChange) {
      const startDate = newWeekStart.format('YYYY-MM-DD');
      const endDate = newWeekStart.endOf('week').format('YYYY-MM-DD');
      onWeekChange(startDate, endDate);
    }
  };

  const handleNextWeek = () => {
    if (isForwardDisabled()) return;

    const newWeekStart = selectedWeekStart.add(1, 'week');
    setSelectedWeekStart(newWeekStart);
    if (onWeekChange) {
      const startDate = newWeekStart.format('YYYY-MM-DD');
      const endDate = newWeekStart.endOf('week').format('YYYY-MM-DD');
      onWeekChange(startDate, endDate);
    }
  };

  const handleDateChange = (newDate) => {
    if (!newDate || !newDate.isValid()) return;
    
    // Check if date is within allowed range
    if (newDate.isBefore(minDate) || newDate.isAfter(maxDate)) {
      alert('Please select a date within 2 months before and 3 months after today');
      return;
    }

    const newWeekStart = newDate.startOf('week');
    setSelectedWeekStart(newWeekStart);
    if (onWeekChange) {
      const startDate = newWeekStart.format('YYYY-MM-DD');
      const endDate = newWeekStart.endOf('week').format('YYYY-MM-DD');
      onWeekChange(startDate, endDate);
    }
  };

  const handleTodayClick = () => {
    const today = dayjs().startOf('week');
    setSelectedWeekStart(today);
    if (onWeekChange) {
      const startDate = today.format('YYYY-MM-DD');
      const endDate = today.endOf('week').format('YYYY-MM-DD');
      console.log('Calling onWeekChange with:', { startDate, endDate }); // Debug log
      onWeekChange(startDate, endDate);
    }
  };

  // Week dates calculation
  // const getWeekDates = (date) => {
  //   return Array.from({ length: 7 }, (_, i) => date.add(i, 'day'));
  // };

  // const weekDates = getWeekDates(selectedWeekStart);

  const weekDates = useMemo(() => {
    const startOfWeek = selectedWeekStart.startOf('week');
    const allDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    
    // Find the first and last valid dates in this week
    const firstValidDate = allDates.find(date => 
      !date.isBefore(minDate) && !date.isAfter(maxDate)
    );
    
    const lastValidDate = [...allDates].reverse().find(date => 
      !date.isBefore(minDate) && !date.isAfter(maxDate)
    );
    
    // If no valid dates found, return empty array
    if (!firstValidDate || !lastValidDate) return [];
    
    // Return only the consecutive dates between first and last valid dates
    return allDates
      .filter(date => 
        !date.isBefore(firstValidDate) && 
        !date.isAfter(lastValidDate)
      );
  }, [selectedWeekStart, minDate, maxDate]);

  // Schedule display logic
  const getMySchedule = (date, shift) => {
    if (!scheduleData?.staff) return 'Office';

    const dateString = date.format('YYYY-MM-DD');
    const scheduleItem = scheduleData.staff.scheduleTrails.find(item => item.date === dateString);
    
    if (!scheduleItem) return 'Office';
    
    if (shift === 'AM' && scheduleItem.is_am) return 'Home';
    if (shift === 'PM' && scheduleItem.is_pm) return 'Home';
    
    return 'Office';
  };

  const getTeamSchedule = (date, shift) => {
    if (!scheduleData?.team) return { inOffice: 0, atHome: 0 };

    const dateString = date.format('YYYY-MM-DD');
    const inOffice = scheduleData.team.filter(member => {
      const scheduleItem = member.scheduleTrails.find(item => item.date === dateString);
      if (!scheduleItem) return true;
      return shift === 'AM' ? !scheduleItem.is_am : !scheduleItem.is_pm;
    });
    const atHome = scheduleData.team.filter(member => {
      const scheduleItem = member.scheduleTrails.find(item => item.date === dateString);
      if (!scheduleItem) return false;
      return shift === 'AM' ? scheduleItem.is_am : scheduleItem.is_pm;
    });

    return { 
      inOffice: inOffice.length || 1,
      atHome: atHome.length 
    };
  };

  // Sidebar functionality
  const handleTeamScheduleClick = (date, shift) => {
    setSelectedDate(date);
    setSelectedShift(shift.name);
    setSidebarOpen(true);
  };

  const renderSidebar = () => {
    if (!selectedDate || !selectedShift) return null;
  
    const dateString = selectedDate.format('YYYY-MM-DD');
    const isAM = selectedShift === 'AM';
  
    let inOffice = [];
    let atHome = [];
  
    if (scheduleData?.team && scheduleData.team.length > 0) {
      inOffice = scheduleData.team.filter(member => {
        const scheduleItem = member.scheduleTrails.find(item => item.date === dateString);
        if (!scheduleItem) return true;
        return isAM ? !scheduleItem.is_am : !scheduleItem.is_pm;
      });
  
      atHome = scheduleData.team.filter(member => {
        const scheduleItem = member.scheduleTrails.find(item => item.date === dateString);
        if (!scheduleItem) return false;
        return isAM ? scheduleItem.is_am : scheduleItem.is_pm;
      });
    } else {
      inOffice = [{ 
        staffID: scheduleData?.staff?.staffID, 
        fullName: scheduleData?.staff?.fullName || `Staff ${scheduleData?.staff?.staffID}`
      }];
      atHome = [];
    }
  
    return (
      <Drawer anchor="right" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
        <Box className="sidebar-content" role="presentation">
          <Typography variant="h4" className="sidebar-title">
            Team Schedule
          </Typography>
          <Typography variant="h5" className="sidebar-date">
            {selectedDate.format('MMM D, YYYY')}
          </Typography>
          <Typography variant="subtitle1" className="sidebar-shift">
            {selectedShift}
          </Typography>
          <Typography variant="h6" className="sidebar-subtitle">In Office:</Typography>
          <List>
            {inOffice.map(member => (
              <ListItem 
                key={member.staffID} 
                style={{ 
                  backgroundColor: member.staffID === highlightedStaffId ? '#e8f5e9' : 'transparent'
                }}
              >
                <ListItemText primary={`${member.fullName} - ${member.position}`} />
              </ListItem>
            ))}
          </List>
          <Typography variant="h6" className="sidebar-subtitle">Working from Home:</Typography>
          <List>
            {atHome.map(member => (
              <ListItem 
                key={member.staffID} 
                style={{ 
                  backgroundColor: member.staffID === highlightedStaffId ? '#e8f5e9' : 'transparent'
                }}
              >
                <ListItemText primary={`${member.fullName} - ${member.position}`} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    );
  };

  // Loading and error states
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!scheduleData) return <div>No data available</div>;

  // Main render
  return (
    <div className="weekly-schedule-container">
      <TableContainer component={Paper} className="centered-table-container">
        <Table className="styled-table">
          <TableHead>
            <TableRow>
              <TableCell>Shift</TableCell>
              {weekDates.map((date) => (
                <TableCell key={date.format('YYYY-MM-DD')}>
                  {date.format('ddd, MMM D')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map(shift => (
              <TableRow key={shift.name}>
                <TableCell className="shift-cell">
                  {shift.name} 
                  <br />
                  ({shift.time})
                </TableCell>
                {weekDates.map((date) => {
                  const { inOffice, atHome } = getTeamSchedule(date, shift.name);
                  const isHighlighted = highlightedStaffId && isHighlightedStaffAtHome(date, shift.name);
                  return (
                    <TableCell key={`${date.format('YYYY-MM-DD')}-${shift.name}`}>
                      <Card className="schedule-card">
                        <Box p={1}>
                          <b>My Schedule</b>
                          <br />
                          <span>Working From: {getMySchedule(date, shift.name)}</span>
                        </Box>
                      </Card>
                      <Card 
                        className={`schedule-card team-schedule-card ${isHighlighted ? 'highlighted' : ''}`} 
                        onClick={() => handleTeamScheduleClick(date, shift)}
                        style={{ backgroundColor: isHighlighted ? '#e8f5e9' : 'transparent' }}
                      >
                        <Box p={1}>
                          <b>Team Schedule</b>
                          <br />
                          <span>Working from Office: {inOffice}</span>
                          <br />
                          <span>Working from Home: {atHome}</span>
                          <br />
                          <Typography 
                            variant="caption" 
                            className="highlight-text"
                            style={{ 
                              color: 'green', 
                              visibility: isHighlighted ? 'visible' : 'hidden',
                              height: '1.2em',
                              marginTop: '2px'
                            }}
                          >
                            Highlighted staff Working from Home
                          </Typography>
                        </Box>
                      </Card>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8}>
                <div className="footer-content">
                  <Button variant="outlined" onClick={handleTodayClick}>
                    Today
                  </Button>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker 
                    label={selectedWeekStart.format('MMMM YYYY')}
                    value={selectedWeekStart}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    shouldDisableDate={(date) => {
                      const dateToCheck = dayjs(date);
                      
                      // At 2-month past limit
                      if (dayjs(selectedWeekStart).isSame(minDate, 'day')) {
                        return dateToCheck.isBefore(selectedWeekStart);
                      }
                      
                      // At 3-month future limit
                      if (dayjs(selectedWeekStart).isSame(maxDate, 'day')) {
                        return dateToCheck.isAfter(selectedWeekStart);
                      }
                      
                      return dateToCheck.isBefore(minDate) || 
                            dateToCheck.isAfter(maxDate);
                    }}
                  />
                  </LocalizationProvider>
                  <TextField
                    variant="outlined"
                    placeholder="Search staff..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                    className="search-field"
                  />
                  <IconButton 
                    onClick={handlePrevWeek}
                    disabled={isBackwardDisabled()}
                    style={{ 
                      color: isBackwardDisabled() ? 'rgba(0, 0, 0, 0.26)' : 'inherit'
                    }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <IconButton 
                    onClick={handleNextWeek}
                    disabled={isForwardDisabled()}
                    style={{ 
                      color: isForwardDisabled() ? 'rgba(0, 0, 0, 0.26)' : 'inherit'
                    }}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      {renderSidebar()}
    </div>
  );
};

export default WeeklyCalendar;