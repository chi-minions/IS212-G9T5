import config from '../config/config';

const BASE_URL = config.ENDPOINT_BE_URL;

export const fetchManagerSchedule = async (managerId, startDate, endDate) => {
    try {
      // First fetch team members
      const teamResponse = await fetch(`${BASE_URL}/api/team/${managerId}`);
      console.log(teamResponse);
      if (!teamResponse.ok) {
        throw new Error(`Error fetching team data: ${teamResponse.status}`);
      }
      const teamMembers = await teamResponse.json();
  
      // Transform team data to include full names
      const teamMembersWithNames = teamMembers.map(member => ({
        ...member,
        fullName: `${member.staff_fname} ${member.staff_lname}`
      }));
  
      // Then fetch WFH schedule
      const scheduleResponse = await fetch(
        `${BASE_URL}/api/manager/${managerId}/team_schedule?start_date=${startDate}&end_date=${endDate}`
      );
      
      let scheduleData = {};
      if (scheduleResponse.status === 404) {
        // If no WFH data, create default schedule with everyone in office
        scheduleData = {
          staff: {
            staff_id: managerId,
            ScheduleDetails: []
          },
          team: []
        };
      } else if (scheduleResponse.ok) {
        scheduleData = await scheduleResponse.json();
      } else {
        throw new Error(`HTTP error! status: ${scheduleResponse.status}`);
      }
  
      // Find manager's data
      const managerData = teamMembersWithNames.find(m => m.staff_id === parseInt(managerId));
  
      // Combine team data with schedule data
      return {
        staff: {
          staffID: scheduleData.staff.staff_id,
          fullName: managerData ? `${managerData.staff_fname} ${managerData.staff_lname}` : `Staff ${scheduleData.staff.staff_id}`,
          position: managerData?.position,
          department: managerData?.dept,
          scheduleTrails: scheduleData.staff.ScheduleDetails?.map(detail => ({
            date: detail.specific_date,
            is_am: detail.is_am,
            is_pm: detail.is_pm
          })) || []
        },
        team: teamMembersWithNames.map(member => {
          // Find this team member's schedule in the schedule data
          const memberSchedule = scheduleData.team.find(t => t.staff_id === member.staff_id)?.ScheduleDetails || [];
          
          return {
            staffID: member.staff_id.toString(),
            fullName: `${member.staff_fname} ${member.staff_lname}`,
            position: member.position,
            department: member.dept,
            scheduleTrails: memberSchedule.map(detail => ({
              date: detail.specific_date,
              is_am: detail.is_am,
              is_pm: detail.is_pm
            }))
          };
        })
      };
    } catch (error) {
      console.error('Error fetching manager schedule:', error);
      throw error;
    }
  };
  
  export const fetchStaffSchedule = async (staffId, startDate, endDate) => {
    try {
      // First fetch team members
      const teamResponse = await fetch(`${BASE_URL}/api/team/${staffId}`);
      if (!teamResponse.ok) {
        throw new Error(`Error fetching team data: ${teamResponse.status}`);
      }
      const teamMembers = await teamResponse.json();
  
      // Transform team data to include full names
      const teamMembersWithNames = teamMembers.map(member => ({
        ...member,
        fullName: `${member.staff_fname} ${member.staff_lname}`
      }));
  
      // Fetch staff's own WFH schedule
      const staffResponse = await fetch(
        `${BASE_URL}/api/staff/${staffId}/wfh_requests?start_date=${startDate}&end_date=${endDate}`
      );
      
      let staffSchedule = [];
      if (staffResponse.status === 404) {
        staffSchedule = [];
      } else if (staffResponse.ok) {
        const staffData = await staffResponse.json();
        staffSchedule = staffData.map(detail => ({
          date: detail.specific_date,
          is_am: detail.is_am,
          is_pm: detail.is_pm
        }));
      } else {
        throw new Error(`HTTP error! status: ${staffResponse.status}`);
      }
  
      // Fetch team schedule
      const teamScheduleResponse = await fetch(
        `${BASE_URL}/api/team/${staffId}/schedule?start_date=${startDate}&end_date=${endDate}`
      );
  
      let teamScheduleData = [];
      if (teamScheduleResponse.status === 404) {
        teamScheduleData = [];
      } else if (teamScheduleResponse.ok) {
        teamScheduleData = await teamScheduleResponse.json();
      }
  
      // Find current staff's data
      const currentStaff = teamMembersWithNames.find(m => m.staff_id === parseInt(staffId));
  
      // Return combined data
      return {
        staff: {
          staffID: staffId,
          fullName: currentStaff ? `${currentStaff.staff_fname} ${currentStaff.staff_lname}` : `Staff ${staffId}`,
          scheduleTrails: staffSchedule
        },
        team: teamMembersWithNames
          .filter(member => member.staff_id !== parseInt(staffId))
          .map(member => ({
            staffID: member.staff_id.toString(),
            fullName: `${member.staff_fname} ${member.staff_lname}`,
            scheduleTrails: (teamScheduleData.find(t => t.staff_id === member.staff_id)?.ScheduleDetails || [])
              .map(detail => ({
                date: detail.specific_date,
                is_am: detail.is_am,
                is_pm: detail.is_pm
              }))
          }))
      };
    } catch (error) {
      console.error('Error fetching staff schedule:', error);
      throw error;
    }
  };