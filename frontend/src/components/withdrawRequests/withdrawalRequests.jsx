import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

const WithdrawalRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { staffId } = useParams();

  // Mock data for withdrawal requests
  const mockWithdrawalRequests = {
    1: [
      { 
        withdrawal_id: 1,
        request_id: 101,
        staff_id: 1,
        schedule_date: '2024-10-01',
        type: 'Full Day',
        reason: 'Need to be in office for important meeting',
        status: 'pending'
      },
      {
        withdrawal_id: 2,
        request_id: 102,
        staff_id: 1,
        schedule_date: '2024-10-15',
        type: 'Morning',
        reason: 'Department gathering',
        status: 'pending'
      }
    ],
    2: [
      {
        withdrawal_id: 3,
        request_id: 103,
        staff_id: 2,
        schedule_date: '2024-10-05',
        type: 'Afternoon',
        reason: 'Team building activity',
        status: 'pending'
      }
    ]
  };

  const fetchWithdrawalRequests = async (staffIds) => {
    try {
      const allRequests = [];
      for (const staffId of staffIds) {
        const data = mockWithdrawalRequests[staffId] || [];
        allRequests.push(...data);
      }
      setRequests(allRequests);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    const staffIds = [1, 2]; // In real implementation, this might come from an API
    fetchWithdrawalRequests(staffIds);
  }, []);

  if (loading) {
    return <div>Loading withdrawal requests...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="withdrawal-requests-container" style={{ padding: '20px' }}>
      <h1>Pending Withdrawal Requests</h1>
      <table className="withdrawal-requests-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Request ID</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Type</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Reason</th>
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.withdrawal_id}>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{request.request_id}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{request.schedule_date}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{request.type}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>{request.reason}</td>
              <td style={{ padding: '10px', borderBottom: '1px solid #ddd' }}>
                <Link to={`/${staffId}/3/withdrawal-approval/${request.staff_id}/${request.withdrawal_id}`}>
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WithdrawalRequests;