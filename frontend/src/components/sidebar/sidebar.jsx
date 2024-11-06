import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Divider 
} from '@mui/material';
import { 
  Home, 
  ListAlt, 
  ExitToApp, 
  School, 
  CalendarToday, 
  Assignment,
  People,
  Assessment,
  Approval
} from '@mui/icons-material';
import './sidebar.css';

const ROLES = {
  HR: 1,
  STAFF: 2,
  MANAGER: 3
};

const Sidebar = ({ staffRole }) => {
  const { staffId } = useParams();
  const location = useLocation();

  // Staff menu items
  const staffMenuItems = [
    {
      heading: 'SCHEDULE',
      items: [
        {
          text: 'Home',
          icon: <Home className="sidebar-icon" />,
          to: `/${staffId}/`
        },
        {
          text: 'Schedule',
          icon: <CalendarToday className="sidebar-icon" />,
          to: `/${staffId}/2/schedule`
        }
      ]
    },
    {
      heading: 'APPLICATION',
      items: [
        {
          text: 'My Requests',
          icon: <Assignment className="sidebar-icon" />,
          to: `/${staffId}/2/requests`
        },
        {
          text: 'Apply',
          icon: <ListAlt className="sidebar-icon" />,
          to: `/${staffId}/2/wfh-request`
        }
      ]
    },
    {
      heading: 'WITHDRAWAL',
      items: [
        {
          text: 'Withdrawal',
          icon: <School className="sidebar-icon" />,
          to: `/${staffId}/2/withdrawal`
        }
      ]
    }
  ];

  // HR-specific menu items
  const hrMenuItems = [
    {
      heading: 'HR MANAGEMENT',
      items: [
        {
          text: 'HR Calendar',
          icon: <Assessment className="sidebar-icon" />,
          to: `/${staffId}/1/hr-calendar`
        }
      ]
    }
  ];

  // Manager-specific menu items
  const managerMenuItems = [
    {
      heading: 'APPROVAL MANAGEMENT',
      items: [
        {
          text: 'Pending Requests',
          icon: <Approval className="sidebar-icon" />,
          to: `/${staffId}/3/pending-requests`
        },
        {
          text: 'Withdrawal Requests',
          icon: <School className="sidebar-icon" />,
          to: `/${staffId}/3/withdrawal-requests`
        }
      ]
    },
  ];

  // Get relevant menu items based on role
  const getMenuItems = () => {
    if (staffRole === ROLES.HR) {
      return [...hrMenuItems, ...managerMenuItems, ...staffMenuItems];
    }
    if (staffRole === ROLES.MANAGER) {
      return [...managerMenuItems, ...staffMenuItems];
    }
    return staffMenuItems;
  };

  const renderMenuSection = (section) => (
    console.log(section),
    <React.Fragment key={section.heading}>
      <Typography className="sidebar-heading">
        {section.heading}
      </Typography>
      {section.items.map((item, index) => (
        <ListItem 
          button 
          component={Link} 
          to={item.to}
          key={`${section.heading}-${index}`}
          selected={location.pathname === item.to}
        >
          <ListItemIcon>
            {item.icon}
          </ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItem>
      ))}
      {section.heading !== 'OTHERS' && <Divider className="sidebar-divider" />}
    </React.Fragment>
  );

  return (
    <Drawer
      className="sideBar"
      variant="permanent"
      anchor="left"
    >
      <div className="sidebar-content">
        <List>
          {getMenuItems().map(section => renderMenuSection(section))}
          
          <Typography className="sidebar-heading">
            OTHERS
          </Typography>
          <ListItem 
            button 
            component={Link} 
            to="/"
            selected={location.pathname === '/'}
          >
            <ListItemIcon>
              <ExitToApp className="sidebar-icon" />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </div>
    </Drawer>
  );
};

export default Sidebar;