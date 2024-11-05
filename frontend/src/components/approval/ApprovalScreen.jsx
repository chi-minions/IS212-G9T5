import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import config from '../../config/config';

const BASE_URL = config.ENDPOINT_BE_URL;

const ApprovalScreen = () => {
  const { staffId, approval_req_id } = useParams();
  const [request, setRequest] = useState(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [allDates, setAllDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const fetchRequestDetails = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/request/${approval_req_id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch the request');
      }

      const data = await response.json();
      setRequest(data.data);
      setIsRecurring(data.is_recurring);
      setAllDates(data.all_dates);
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

  const handleSubmit = async (e, decisionStatus) => {
    e.preventDefault();
    setValidationError('');
    setError(null); // Clear any previous API errors

    // Validate decision notes
    if (!decisionNotes.trim()) {
      setValidationError('Please provide a reason for your decision');
      return; // Add this return to prevent the API call
    }

    try {
      const payload = {
        request_id: approval_req_id,
        decision_status: decisionStatus,
        decision_notes: decisionNotes,
        manager_id: staffId
      };

      const endpoint = isRecurring ? `${BASE_URL}/api/approve_recurring` : `${BASE_URL}/api/approve`;

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
      navigate(`/${staffId}/3/pending-requests`);
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
      
      <div style={{ marginBottom: '20px' }}>
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

      <form onSubmit={(e) => e.preventDefault()}>
        <div style={{ marginBottom: '20px' }}>
          <label>
            Reason for Approval/Rejection:
            <textarea
              value={decisionNotes}
              onChange={(e) => {
                setDecisionNotes(e.target.value);
                setValidationError('');
              }}
              placeholder="Add your reason here..."
              style={{ 
                width: '100%', 
                minHeight: '100px',
                padding: '8px',
                marginTop: '8px',
                borderColor: validationError ? '#dc3545' : '#ced4da',
                borderRadius: '4px'
              }}
            />
          </label>
          {validationError && (
            <div style={{ color: '#dc3545', fontSize: '14px', marginTop: '5px' }}>
              {validationError}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            type="submit"
            onClick={(e) => handleSubmit(e, 'Approved')}
            style={{ 
              backgroundColor: '#28a745', 
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Approve
          </button>
          <button 
            type="submit"
            onClick={(e) => handleSubmit(e, 'Rejected')}
            style={{ 
              backgroundColor: '#dc3545', 
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reject
          </button>
        </div>
      </form>

      {error && (
        <div style={{ 
          color: '#dc3545', 
          marginTop: '20px', 
          padding: '10px', 
          backgroundColor: '#f8d7da',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ApprovalScreen;