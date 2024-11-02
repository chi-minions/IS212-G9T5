import React, { useState, useEffect } from 'react'; 
import { Link, useParams } from 'react-router-dom';  

const PendingRequests = () => {   
  const { staffId } = useParams(); // Assumes managerId is part of the URL
  console.log(staffId);
  const [requests, setRequests] = useState([]);   
  const [loading, setLoading] = useState(true);   
  const [error, setError] = useState(null);   

  const fetchAllRequests = async () => {     
    try {       
      const manager_id = staffId;
      const response = await fetch(`/api/team-manager/${manager_id}/pending-requests`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch pending requests');
      }
      
      const data = await response.json();
      const allRequests = data.team_pending_requests.flatMap(member => 
        member.pending_requests.map(request => ({
          ...request,
          dates: [request.specific_date] // Group requests by request_id later
        }))
      );

      setRequests(allRequests);       
      setLoading(false);     
    } catch (err) {       
      setError(err.message);       
      setLoading(false);     
    }   
  };    

  const groupRequestsByRequestId = (requests) => {     
    const groupedRequests = {};          
    requests.forEach((request) => {       
      if (!groupedRequests[request.request_id]) {         
        groupedRequests[request.request_id] = {           
          request_id: request.request_id,           
          staff_id: request.staff_id,           
          dates: [request.specific_date],         
        };       
      } else {         
        groupedRequests[request.request_id].dates.push(request.specific_date);       
      }     
    });          
    return Object.values(groupedRequests);   
  };    

  useEffect(() => {     
    fetchAllRequests();   
  }, [staffId]);    

  if (loading) {     
    return <div>Loading pending requests...</div>;   
  }    

  if (error) {     
    return <div>Error: {error}</div>;   
  }    

  const groupedRequests = groupRequestsByRequestId(requests);    

  return (     
    <div className="pending-requests-container" style={{ padding: '20px' }}>       
      <h2>Attendance</h2>       
      <h3>Pending Requests</h3>       
      
      {/* Combined Table for Request ID, Specific Dates, and Action */}
      <table className="pending-requests-table" style={{ width: '100%', borderCollapse: 'collapse' }}>         
        <thead>           
          <tr>             
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e5e5', backgroundColor: '#f9f9f9' }}>Request ID</th>             
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e5e5', backgroundColor: '#f9f9f9' }}>Specific Date(s)</th>             
            <th style={{ padding: '10px', textAlign: 'left', borderBottom: '2px solid #e5e5e5', backgroundColor: '#f9f9f9' }}>Action</th>           
          </tr>         
        </thead>         
        <tbody>           
          {groupedRequests.map((request) => (             
            <tr key={request.request_id}>               
              <td style={{ padding: '10px', borderBottom: '1px solid #e5e5e5' }}>{request.request_id}</td>               
              <td style={{ padding: '10px', borderBottom: '1px solid #e5e5e5' }}>                 
                {request.dates.map((date, index) => (                   
                  <div key={index} style={{ lineHeight: '1.6' }}>                     
                    {date}                   
                  </div>                 
                ))}               
              </td>               
              <td style={{ padding: '10px', borderBottom: '1px solid #e5e5e5' }}>                 
                <Link 
                  to={`/${staffId}/3/approval/${request.request_id}`}  // Adjusted to match the route
                  style={{ color: '#007bff', textDecoration: 'none' }}
                >                   
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

export default PendingRequests;
