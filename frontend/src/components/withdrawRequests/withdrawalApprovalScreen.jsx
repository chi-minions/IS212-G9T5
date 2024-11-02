import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const WithdrawalApprovalScreen = () => {
  const { staffId, approval_staff_id, withdrawal_id } = useParams();
  const [request, setRequest] = useState(null);
  const [decisionNotes, setDecisionNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Mock data for a single withdrawal request
  const mockWithdrawalRequest = {
    withdrawal_id: 1,
    request_id: 101,
    staff_id: 1,
    schedule_date: '2024-10-01',
    type: 'Full Day',
    reason: 'Need to be in office for important meeting',
    status: 'pending'
  };

  useEffect(() => {
    // Simulate fetching withdrawal request details
    setRequest(mockWithdrawalRequest);
    setLoading(false);
  }, [withdrawal_id]);

  const handleDecision = async (decisionStatus) => {
    try {
      const payload = {
        withdrawal_id: withdrawal_id,
        manager_id: staffId,
        staff_id: approval_staff_id,
        decision_status: decisionStatus,
        decision_notes: decisionNotes
      };

      console.log('Payload that will be sent:', payload);
      
      // Here you would make the actual API call
      
      alert(`Withdrawal request ${decisionStatus}`);
      navigate(`/${staffId}/3/withdrawal-requests`);
    } catch (error) {
      console.error('Error processing withdrawal decision:', error);
      setError('Failed to process the decision. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!request) return <div>Request not found</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Withdrawal Request Approval</h2>
      <div style={{ marginBottom: '20px' }}>
        <h3>Request Details:</h3>
        <p><strong>Reference Request ID:</strong> {request.request_id}</p>
        <p><strong>Date:</strong> {request.schedule_date}</p>
        <p><strong>Type:</strong> {request.type}</p>
        <p><strong>Staff's Reason:</strong> {request.reason}</p>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Decision Notes:
          <textarea
            value={decisionNotes}
            onChange={(e) => setDecisionNotes(e.target.value)}
            placeholder="Add your reason for approval/rejection..."
            style={{ 
              width: '100%', 
              minHeight: '100px',
              marginTop: '10px',
              padding: '8px'
            }}
          />
        </label>
      </div>

      <div>
        <button 
          onClick={() => handleDecision('approved')}
          style={{
            backgroundColor: 'green',
            color: 'white',
            padding: '8px 16px',
            marginRight: '10px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Approve
        </button>
        <button 
          onClick={() => handleDecision('rejected')}
          style={{
            backgroundColor: 'red',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reject
        </button>
      </div>
    </div>
  );
};

export default WithdrawalApprovalScreen;