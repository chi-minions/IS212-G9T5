import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ApprovalScreen = () => {
  
  const { staffId, approval_req_id } = useParams();
  const [request, setRequest] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [allDates, setAllDates] = useState([]); // Store all dates for recurring requests
  const [loading, setLoading] = useState(true);
  const [decisionNotes, setDecisionNotes] = useState('');  
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`/api/request/${approval_req_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch the request');
      }

      const data = await response.json();
      setRequest(data.data);
      setIsRecurring(data.is_recurring);
      setAllDates(data.all_dates); // Set all dates for recurring requests
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestDetails();
  }, [approval_req_id]);

  const formatDayType = (is_am, is_pm) => {
    if (is_am && is_pm) {
      return 'Full Day';
    } else if (is_am) {
      return 'Half Day (AM)';
    } else if (is_pm) {
      return 'Half Day (PM)';
    } else {
      return 'No WFH';
    }
  };

  const handleDecision = async (decisionStatus) => {
    try {
      const payload = {
        request_id: approval_req_id,
        decision_status: decisionStatus,
        decision_notes: decisionNotes,
        manager_id: staffId
      };

      const endpoint = isRecurring ? '/api/approve_recurring' : '/api/approve';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to process the decision');
      }

      alert(`Decision successfully made: ${decisionStatus}`);
      setError(null);

      navigate(`/3/pending-requests`);
    } catch (error) {
      console.error('Error submitting the decision:', error);
      setError(error.message || 'An error occurred while submitting the decision.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Approval Screen for Request ID: {approval_req_id}</h2>
      <div>
        <p>Staff ID: {request.staff_id}</p>
        {isRecurring ? (
          <div>
            <h3>Requested Dates:</h3>
            <ul>
              {allDates.map((date, index) => (
                <li key={index}>
                  {date.specific_date} - {formatDayType(date.is_am, date.is_pm)}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>Date: {request.specific_date} - {formatDayType(request.is_am, request.is_pm)}</p>
        )}
      </div>
      <div>
        <label>
          Reason for Approval/Rejection:
          <textarea
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder="Add your reason here..."
            style={{ width: '100%', minHeight: '100px' }}
          />
        </label>
      </div>
      <div>
        <button 
          onClick={() => handleDecision('Approved')} 
          style={{ backgroundColor: 'green', color: 'white', marginRight: '10px' }}
        >
          Approve
        </button>
        <button 
          onClick={() => handleDecision('Rejected')} 
          style={{ backgroundColor: 'red', color: 'white' }}
        >
          Reject
        </button>
      </div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default ApprovalScreen;

