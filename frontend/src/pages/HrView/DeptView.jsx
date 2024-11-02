import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, Typography, Box, Card, List, ListItem, ListItemText } from '@mui/material';
import dayjs from 'dayjs';

const DeptView = () => {
  const location = useLocation();
  const { department, date } = location.state;

  // Date formatting
  const formattedDate = date ? dayjs(date).format('DD MMM YYYY') : 'Invalid Date';
  const apiDate = date ? dayjs(date).format('YYYY-MM-DD') : '';
  console.log('Formatted date:', formattedDate);
  console.log('API date:', apiDate);

  const [view, setView] = useState('dept');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [scheduleData, setScheduleData] = useState({});
  const [employeeDetails, setEmployeeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch department data and employee details
  useEffect(() => {
    if (!date) {
      setError('Invalid date received');
      setLoading(false);
      return;
    }
    
    const fetchDepartmentData = async () => {
      setLoading(true);
      try {
        // Fetch managers data
        const managersResponse = await fetch('/api/managers');
        const managersData = await managersResponse.json();
        const deptData = managersData[department.toLowerCase()] || [];

        // Fetch all employees to get their details
        const employeesResponse = await fetch('http://localhost:5001/api/all', { 
          credentials: 'include' 
        });
        const employeesData = await employeesResponse.json();
        
        // Create a map of employee details
        const employeeMap = employeesData.reduce((acc, emp) => {
          acc[emp.staff_id] = {
            staff_fname: emp.staff_fname,
            staff_lname: emp.staff_lname
          };
          return acc;
        }, {});
        
        setEmployeeDetails(employeeMap);

        // Add manager names to department data
        const managersWithDetails = deptData.map(manager => ({
          ...manager,
          teamName: `Team of ${employeeMap[manager.staff_id]?.staff_fname || ''} ${employeeMap[manager.staff_id]?.staff_lname || ''}`
        }));

        setDepartmentData(managersWithDetails);
        setError(null);

        // Fetch all schedules at once
        const schedulePromises = managersWithDetails.map(manager =>
          fetch(`/api/manager/${manager.staff_id}/team_schedule?start_date=${apiDate}&end_date=${apiDate}`)
            .then(res => res.json())
            .then(data => ({ [manager.staff_id]: data }))
        );

        const scheduleResults = await Promise.all(schedulePromises);
        const combinedSchedules = scheduleResults.reduce((acc, curr) => ({...acc, ...curr}), {});
        setScheduleData(combinedSchedules);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentData();
  }, [department, apiDate]);

  const handleTeamClick = (team) => {
    setSelectedTeam(team);
    setView('team');
  };

  const handleBackClick = () => {
    setView('dept');
    setSelectedTeam(null);
  };

  const renderTeamMembers = () => {
    const teamData = scheduleData[selectedTeam.staff_id]?.team || [];
    
    return teamData.map((member) => {
      const isWfh = member.ScheduleDetails.some(schedule => 
        schedule.specific_date === apiDate
      );
      const employeeDetail = employeeDetails[member.staff_id] || {};

      return (
        <ListItem key={member.staff_id}>
          <ListItemText
            primary={`${employeeDetail.staff_fname || ''} ${employeeDetail.staff_lname || ''} (ID: ${member.staff_id})`}
            secondary={isWfh ? 'Working From Home' : 'In Office'}
          />
        </ListItem>
      );
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Loading...</Typography>
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
    <div>
      {view === 'dept' ? (
        <div>
          <Typography variant="h4" gutterBottom>{`Department: ${department}`}</Typography>
          <Typography variant="h6">{`Date: ${formattedDate}`}</Typography>
          <Box mt={3}>
            {departmentData?.map((team) => (
              <Card key={team.staff_id} style={{ marginBottom: '16px', padding: '16px' }}>
                <Typography variant="h6">{team.teamName}</Typography>
                <Typography variant="body2">
                  Team Size: {team.teamSize}
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => handleTeamClick(team)}
                  style={{ marginTop: '8px' }}
                >
                  View Team
                </Button>
              </Card>
            ))}
          </Box>
        </div>
      ) : (
        <div>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleBackClick}
            style={{ marginBottom: '16px' }}
          >
            Back to Department View
          </Button>
          <Typography variant="h4" gutterBottom>{`Team: ${selectedTeam.teamName}`}</Typography>
          <Typography variant="h6">{`Date: ${formattedDate}`}</Typography>
          <Box mt={3}>
            <List>
              {renderTeamMembers()}
            </List>
          </Box>
        </div>
      )}
    </div>
  );
};

export default DeptView;



