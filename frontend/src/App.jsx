import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useParams, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import StaffViewSchedule from './pages/StaffViewSchedule';
import DeptView from './pages/HrView/DeptView';
import HrCalendar from './pages/HrView/HrCalendar';
import Sidebar from './components/sidebar/sidebar';
import Navbar from './components/navbar/navbar';
import ManageerViewTeamSchedule from './pages/ManagerViewTeamSchedule';
import ApprovalScreen from './components/approval/ApprovalScreen';
import PendingRequests from './components/approval/PendingRequests';
import WFHRequestForm from './components/apply/WFHRequestForm';
import WithdrawalFormView from './pages/WithdrawalFormView';
import StaffRequestsView from './pages/StaffRequestsView';
import WithdrawalRequests from './components/withdrawRequests/withdrawalRequests';
import WithdrawalApprovalScreen from './components/withdrawRequests/withdrawalApprovalScreen';
import './App.css';

// Define roles as constants for better maintainability
const ROLES = {
  HR: 1,
  STAFF: 2,
  MANAGER: 3
};

const ProtectedRoute = ({ children, allowedRoles, staffRole }) => {
  if (allowedRoles.includes(staffRole)) {
    return children;
  } else {
    return <Navigate to="/" replace />;
  }
};

function AppContent() {
  const { staffId } = useParams();
  const [staffRole, setStaffRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (staffId) {
      fetch(`http://localhost:5001/api/role/${staffId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          console.log('response:', response);
          return response.json();
        })
        .then(data => {
          if (data.error) {
            throw new Error(data.error);
          }
          setStaffRole(data.role);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching staff role:', error);
          setLoading(false);
        });
    }
  }, [staffId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-container">
        <Sidebar staffRole={staffRole} staffId={staffId} error={error} loading={loading} />
        <div className="content-area">
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div>Error: {error}. Please try refreshing the page or contact support.</div>
          ) : (
            <Routes>
              <Route index element={<Home staffId={staffId} />} />
              
              {/* HR Routes (Role 1) */}
              <Route path="1">
                <Route path="dept-view" element={
                  <ProtectedRoute allowedRoles={[ROLES.HR]} staffRole={staffRole}>
                    <DeptView />
                  </ProtectedRoute>
                } />
                <Route path="hr-calendar" element={
                  <ProtectedRoute allowedRoles={[ROLES.HR]} staffRole={staffRole}>
                    <HrCalendar />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Staff Routes (Role 2) - Common functionalities for all roles */}
              <Route path="2">
                <Route path="schedule" element={
                  <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER, ROLES.HR]} staffRole={staffRole}>
                    <StaffViewSchedule staffId={staffId} />
                  </ProtectedRoute>
                } />
                <Route path="wfh-request" element={
                  <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER]} staffRole={staffRole}>
                    <WFHRequestForm staffId={staffId} />
                  </ProtectedRoute>
                } />
                <Route path="requests" element={
                  <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER]} staffRole={staffRole}>
                    <StaffRequestsView staffId={staffId} />
                  </ProtectedRoute>
                } />
                <Route path="withdrawal" element={
                  <ProtectedRoute allowedRoles={[ROLES.STAFF, ROLES.MANAGER]} staffRole={staffRole}>
                    <WithdrawalFormView staffId={staffId} />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Manager Routes (Role 3) */}
              <Route path="3">
                <Route path="schedule" element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]} staffRole={staffRole}>
                    <ManageerViewTeamSchedule staffId={staffId} />
                  </ProtectedRoute>
                } />
                <Route path="approval/:approval_req_id" element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]} staffRole={staffRole}>
                    <ApprovalScreen />
                  </ProtectedRoute>
                } />
                <Route path="pending-requests" element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]} staffRole={staffRole}>
                    <PendingRequests staffId={staffId} />
                  </ProtectedRoute>
                } />
                <Route path="withdrawal-requests" element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]} staffRole={staffRole}>
                    <WithdrawalRequests/>
                  </ProtectedRoute>
                } />
                <Route path="withdrawal-approval/:approval_staff_id/:withdrawal_id" element={
                  <ProtectedRoute allowedRoles={[ROLES.MANAGER]} staffRole={staffRole}>
                    <WithdrawalApprovalScreen />
                  </ProtectedRoute>
                } />
              </Route>

              <Route path="*" element={<Navigate to={`/${staffId}`} replace />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/:staffId/*" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;