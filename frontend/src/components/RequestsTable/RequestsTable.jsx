import React, { useState, useEffect } from 'react';
import { fetchWfhRequests, cancelWfhRequest } from '../../api/requests/requestsApi';
import './RequestsTable.css';

const RequestsTable = ({ staffId }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelError, setCancelError] = useState(null);
  const [filters, setFilters] = useState({
    date: '',
    status: '',
  });

  const getShiftType = (is_am, is_pm) => {
    if (is_am && is_pm) return "Full Day";
    if (is_am) return "AM Shift";
    if (is_pm) return "PM Shift";
    return "Unknown";
  };

  const fetchRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchWfhRequests(staffId);
      const requestsWithShiftType = data.map(request => ({
        ...request,
        shiftType: getShiftType(request.is_am, request.is_pm)
      }));
      setRequests(requestsWithShiftType);
      setFilteredRequests(requestsWithShiftType);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [staffId]);

  const handleFilter = () => {
    const filtered = requests.filter(request => {
      return (
        (filters.date ? request.specific_date === filters.date : true) &&
        (filters.status ? request.request_status === filters.status : true)
      );
    });
    setFilteredRequests(filtered);
  };

  const handleCancel = async (request_id, specific_date) => {
    try {
      setCancelError(null);
      await cancelWfhRequest(staffId, request_id, specific_date);
      
      const updatedRequests = requests.map(request => {
        if (request.request_id === request_id && request.specific_date === specific_date) {
          return { ...request, request_status: 'Cancelled' };
        }
        return request;
      });
      setRequests(updatedRequests);
      setFilteredRequests(updatedRequests);
      
      alert('Request cancelled successfully');
    } catch (error) {
      console.error('Error cancelling request:', error);
      setCancelError(error.message);
      alert(error.message);
    }
  };

  const confirmCancel = (request_id, specific_date) => {
    const confirmed = window.confirm('Are you sure you want to cancel this request?');
    if (confirmed) {
      handleCancel(request_id, specific_date);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const FilterSection = () => (
    <div className="filter-section">
      <input
        type="date"
        value={filters.date}
        onChange={(e) => setFilters({ ...filters, date: e.target.value })}
      />
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="">Select Status</option>
        <option value="Approved">Approved</option>
        <option value="Rejected">Rejected</option>
        <option value="Withdrawal">Withdrawal</option>
        <option value="Cancelled">Cancelled</option>
        <option value="Pending">Pending</option>
      </select>
      <button onClick={handleFilter}>Filter</button>
    </div>
  );

  if (error === 'No WFH requests found for this staff member.') {
    return (
      <div className="request-table">
        <FilterSection />
        <p className="no-requests-message">{error}</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  return (
    <div className="request-table">
      <FilterSection />
      
      {cancelError && (
        <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
          {cancelError}
        </div>
      )}

      {Array.isArray(filteredRequests) && filteredRequests.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Shift Type</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={`${request.request_id}-${request.specific_date}`}>
                <td>{request.request_id}</td>
                <td>{request.specific_date}</td>
                <td>{request.shiftType}</td>
                <td>{request.request_status}</td>
                <td>
                  {request.request_status === 'Pending' ? (
                    <button 
                      onClick={() => confirmCancel(request.request_id, request.specific_date)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  ) : (
                    'No Actions Available'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No requests match your filter criteria.</p>
      )}
    </div>
  );
};

export default RequestsTable;