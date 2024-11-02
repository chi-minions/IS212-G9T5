import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import './WithdrawalForm.css';

const WithdrawalForm = ({ staffId }) => {
  const [approvedSchedules, setApprovedSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchApprovedSchedules();
  }, [staffId]);

  const getShiftType = (is_am, is_pm) => {
    if (is_am && is_pm) return "Full Day";
    if (is_am) return "AM Shift";
    if (is_pm) return "PM Shift";
    return "Unknown";
  };

  const fetchApprovedSchedules = async () => {
    try {
      const today = new Date();
      const startDate = format(subMonths(today, 2), 'yyyy-MM-dd');
      const endDate = format(addMonths(today, 3), 'yyyy-MM-dd');

      const response = await fetch(
        `http://localhost:5001/api/staff/${staffId}/wfh_requests?start_date=${startDate}&end_date=${endDate}`
      );

      const data = await response.json();
      console.log(data);
      
      if (response.status === 404 || data.length === 0) {
        setApprovedSchedules([]);
        setMessage('You have no approved requests to withdraw');
        return;
      }
      
      if (!response.ok) {
        setMessage('Failed to fetch approved schedules');
        return;
      }

      // Transform the data to include the shift type
      const transformedData = data.map(schedule => ({
        ...schedule,
        id: schedule.request_id,  // Map request_id to id
        type: getShiftType(schedule.is_am, schedule.is_pm)
      }));

      setApprovedSchedules(transformedData);
      setMessage('');
    } catch (error) {
      setMessage('Failed to fetch approved schedules');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const selectedRequest = approvedSchedules.find(
        schedule => schedule.id === selectedSchedule
      );

      if (!selectedRequest) {
        setMessage('Invalid schedule selected');
        return;
      }

      const response = await fetch('http://localhost:5001/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: selectedSchedule,
          reason: reason,
          specific_date: selectedRequest.specific_date
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to submit withdrawal');
        return;
      }

      setMessage('Withdrawal submitted successfully');
      setSelectedSchedule('');
      setReason('');
      fetchApprovedSchedules();
    } catch (error) {
      setMessage('Failed to submit withdrawal');
    } finally {
      setIsLoading(false);
    }
  };

  if (message === 'You have no approved requests to withdraw') {
    return <div className="withdrawal-form">{message}</div>;
  }

  return (
    <form className="withdrawal-form" onSubmit={handleSubmit}>
      {message && <div className="message">{message}</div>}
      <div className="form-group">
        <label htmlFor="schedule">Select schedule you wish to withdraw</label>
        <select
          id="schedule"
          value={selectedSchedule}
          onChange={(e) => setSelectedSchedule(e.target.value)}
          required
        >
          <option value="">Select a schedule</option>
          {approvedSchedules.map((schedule) => (
            <option key={schedule.id} value={schedule.id}>
              {format(new Date(schedule.specific_date), 'yyyy-MM-dd')} : {schedule.type}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="reason">Please state reason for Withdrawal</label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
      </div>
      <button 
        type="submit" 
        className="submit-btn"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
};

export default WithdrawalForm;