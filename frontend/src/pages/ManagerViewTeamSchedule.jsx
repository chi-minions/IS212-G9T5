import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import WeeklyCalendar from '../components/WeeklyCalendar/WeeklyCalendar';
import { fetchManagerSchedule } from '../api/scheduleApi';

function ManagerViewTeamSchedule() {
  const { staffId } = useParams();
  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDateRange, setCurrentDateRange] = useState({
    startDate: dayjs().startOf('week').format('YYYY-MM-DD'),
    endDate: dayjs().endOf('week').format('YYYY-MM-DD')
  });

  const fetchData = async (startDate, endDate) => {
    try {
      setIsLoading(true);
      const data = await fetchManagerSchedule(staffId, startDate, endDate);
      setScheduleData(data);
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentDateRange.startDate, currentDateRange.endDate);
  }, [staffId, currentDateRange]);

  const handleWeekChange = (startDate, endDate) => {
    console.log('Date range changed:', { startDate, endDate }); // Debug log
    setCurrentDateRange({ startDate, endDate });
  };

  return (
    <WeeklyCalendar
      scheduleData={scheduleData}
      isLoading={isLoading}
      error={error}
      onWeekChange={handleWeekChange}
      initialStartDate={currentDateRange.startDate}
    />
  );
}

export default ManagerViewTeamSchedule;