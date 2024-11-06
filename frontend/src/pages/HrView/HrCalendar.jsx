import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableFooter, TableRow, 
  Paper, Box, Card, Typography, IconButton, Button, Menu, MenuItem, Checkbox, FormControlLabel,
  Skeleton
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import dayjs from 'dayjs';
import '../../components/WeeklyCalendar/WeeklyCalendar.css';
import config from '../../config/config';

const BASE_URL = config.ENDPOINT_BE_URL;

const HrCalendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [departmentManagers, setDepartmentManagers] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { staffId } = useParams();

  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const isBackwardDisabled = currentDate.isBefore(dayjs().subtract(2, 'month').startOf('month'));
  const isForwardDisabled = currentDate.isAfter(dayjs().add(3, 'month').endOf('month'));

  const isDateOutOfRange = (date) => {
    const twoMonthsAgo = dayjs().subtract(2, 'month');
    const threeMonthsAhead = dayjs().add(3, 'month');
    const dateToCheck = dayjs(date);
    
    // Always block dates before the currently selected date
    if (dateToCheck.isBefore(currentDate, 'day')) {
      return true;
    }
    
    return dateToCheck.isBefore(twoMonthsAgo) || dateToCheck.isAfter(threeMonthsAhead);
  };
  
  const isDateInRange = (date) => {
    const minDate = dayjs().subtract(2, 'month').startOf('month');
    const maxDate = dayjs().add(3, 'month').endOf('month');
    return date.isBetween(minDate, maxDate, 'day', '[]');
  };
  
  const isDateDisabled = (date) => {
    const minDate = dayjs().subtract(2, 'month').startOf('month');
    return dayjs(date).isBefore(minDate, 'day');
  };


  const shifts = [
    { name: 'AM', time: '9:00 - 13:00' },
    { name: 'PM', time: '14:00 - 18:00' }
  ];

  const weekDates = useMemo(() => {
    const startOfWeek = currentDate.startOf('week');
    const twoMonthsAgo = dayjs().subtract(2, 'month');
    const threeMonthsAhead = dayjs().add(3, 'month');
    
    // Get all dates in the week
    const allDates = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
    
    // Find the first and last valid dates in this week
    const firstValidDate = allDates.find(date => 
      !date.isBefore(twoMonthsAgo) && !date.isAfter(threeMonthsAhead)
    );
    
    const lastValidDate = [...allDates].reverse().find(date => 
      !date.isBefore(twoMonthsAgo) && !date.isAfter(threeMonthsAhead)
    );
    
    // If no valid dates found, return empty array
    if (!firstValidDate || !lastValidDate) return [];
    
    // Return only the consecutive dates between first and last valid dates
    return allDates
      .filter(date => 
        !date.isBefore(firstValidDate) && 
        !date.isAfter(lastValidDate)
      )
      .map(date => date.format('YYYY-MM-DD'));
  }, [currentDate]);

  // Fetch managers once when component mounts
  useEffect(() => {
    const fetchManagers = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/api/managers`);
        const data = await response.json();
        setDepartmentManagers(data);
        setError(null);
      } catch (error) {
        console.error('Error fetching managers:', error);
        setError(error.message);
      }
    };

    fetchManagers();
  }, []);

  // Fetch schedules when week changes
  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      setScheduleData({}); // Clear existing schedule data
      
      try {
        const startDate = currentDate.startOf('week').format('YYYY-MM-DD');
        const endDate = currentDate.endOf('week').format('YYYY-MM-DD');
        
        // Fetch schedules for all managers in parallel
        const schedulePromises = Object.values(departmentManagers).flat().map(manager =>
          fetch(`${BASE_URL}/api/manager/${manager.staff_id}/team_schedule?start_date=${startDate}&end_date=${endDate}`)
            .then(res => res.json())
            .then(data => ({ [manager.staff_id]: data }))
        );

        const scheduleResults = await Promise.all(schedulePromises);
        const combinedSchedules = scheduleResults.reduce((acc, curr) => ({...acc, ...curr}), {});
        
        setScheduleData(combinedSchedules);
        setError(null);
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (Object.keys(departmentManagers).length > 0) {
      fetchSchedules();
    }
  }, [currentDate, departmentManagers]);

  const handleDepartmentClick = (department, date) => {
    console.log('Date being passed:', date);
    const dateStr = typeof date === 'string' ? date : dayjs(date).format('YYYY-MM-DD');
    console.log('Formatted date:', dateStr);
    navigate(`/${staffId}/1/dept-view`, { 
      state: { 
        department, 
        date: dateStr
      } 
    });
  };

  const AttendanceCell = React.memo(({ date, department }) => {
    const isDataReady = useMemo(() => {
      const managers = departmentManagers[department] || [];
      return managers.every(manager => 
        scheduleData[manager.staff_id]?.team !== undefined
      );
    }, [date, department, departmentManagers, scheduleData]);

    const calculateAttendance = useMemo(() => {
      if (!isDataReady) return null;

      const managers = departmentManagers[department] || [];
      let inOfficeCount = 0;
      let totalCount = 0;

      managers.forEach(manager => {
        const teamData = scheduleData[manager.staff_id]?.team || [];
        totalCount += manager.teamSize;
        
        teamData.forEach(member => {
          const hasWfhOnDate = member.ScheduleDetails.some(schedule => 
            schedule.specific_date === date
          );
          if (!hasWfhOnDate) {
            inOfficeCount++;
          }
        });
      });

      return { inOffice: inOfficeCount, total: totalCount };
    }, [date, department, departmentManagers, scheduleData, isDataReady]);

    return (
      <Card className="schedule-card">
        <Box p={1}>
          {!isDataReady ? (
            <Skeleton width="100%" height={24} animation="wave" />
          ) : (
            <Typography variant="body2">
              {department}: {calculateAttendance.inOffice} / {calculateAttendance.total}
            </Typography>
          )}
        </Box>
      </Card>
    );
  });

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDepartmentToggle = (department) => {
    setSelectedDepartments(prev => {
      if (prev.includes(department)) {
        return prev.filter(d => d !== department);
      } else {
        return [...prev, department];
      }
    });
  };

  if (loading && Object.keys(departmentManagers).length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading calendar data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <div className="weekly-schedule-container">
      <TableContainer component={Paper} className="centered-table-container">
        <Table className="styled-table">
          <TableHead>
            <TableRow>
              <TableCell>Shift</TableCell>
              {weekDates.map((date) => (
                <TableCell key={dayjs(date).format('YYYY-MM-DD')}>
                  {dayjs(date).format('ddd, MMM D')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
  {shifts.map(shift => (
    <TableRow key={shift.name}>
      <TableCell className="shift-cell">
        {shift.name}<br />({shift.time})
      </TableCell>
      {weekDates.map((date) => (
        <TableCell key={date || `empty-${date}`}>
          {date && departmentManagers && 
            Object.keys(departmentManagers)
              .filter(department => selectedDepartments.length === 0 || selectedDepartments.includes(department))
              .map(department => (
                <Button
                  key={`${date}-${department}`}
                  variant="outlined"
                  fullWidth
                  onClick={() => handleDepartmentClick(department, date)}
                  style={{ 
                    textAlign: 'left', 
                    textTransform: 'none', 
                    display: 'block', 
                    marginBottom: '8px'
                  }}
                >
                  <AttendanceCell
                    date={date}
                    department={department}
                  />
                </Button>
              ))}
        </TableCell>
      ))}
    </TableRow>
  ))}
</TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={8}>
                <div className="footer-content">
                  <IconButton 
                    onClick={handleFilterClick}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <FilterListIcon />
                  </IconButton>
                  <Menu
                    anchorEl={filterAnchorEl}
                    open={Boolean(filterAnchorEl)}
                    onClose={handleFilterClose}
                  >
                    <MenuItem>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={selectedDepartments.length === 0}
                            onChange={() => setSelectedDepartments([])}
                          />
                        }
                        label="Show All"
                      />
                    </MenuItem>
                    {departmentManagers && Object.keys(departmentManagers).map(department => (
                      <MenuItem key={department}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedDepartments.includes(department)}
                              onChange={() => handleDepartmentToggle(department)}
                            />
                          }
                          label={department.charAt(0).toUpperCase() + department.slice(1)}
                        />
                      </MenuItem>
                    ))}
                  </Menu>
                  <Button 
                    variant="outlined" 
                    onClick={() => setCurrentDate(dayjs())}
                    sx={{ mx: 1 }}
                  >
                    Today
                  </Button>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label={currentDate.format('MMMM YYYY')}
                    value={currentDate}
                    onChange={(newDate) => setCurrentDate(dayjs(newDate))}
                    minDate={dayjs().subtract(2, 'month')}
                    maxDate={dayjs().add(3, 'month')}
                    shouldDisableDate={(date) => {
                      const dateToCheck = dayjs(date);
                      
                      // At 2-month past limit
                      if (dayjs(currentDate).isSame(dayjs().subtract(2, 'month'), 'day')) {
                        return dateToCheck.isBefore(currentDate);
                      }
                      
                      // At 3-month future limit
                      if (dayjs(currentDate).isSame(dayjs().add(3, 'month'), 'day')) {
                        return dateToCheck.isAfter(currentDate);
                      }
                      
                      return dateToCheck.isBefore(dayjs().subtract(2, 'month')) || 
                            dateToCheck.isAfter(dayjs().add(3, 'month'));
                    }}
                  />
                  </LocalizationProvider>
                  <IconButton 
                    onClick={() => setCurrentDate(prev => prev.subtract(1, 'week'))} 
                    sx={{ ml: 1 }}
                    disabled={isBackwardDisabled}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <IconButton 
                    onClick={() => setCurrentDate(prev => prev.add(1, 'week'))}
                    disabled={isForwardDisabled}
                  >
                    <ArrowForwardIcon />
                  </IconButton>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </div>
  );
};

export default HrCalendar;







