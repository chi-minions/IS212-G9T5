import unittest
import flask_testing
from server import app, db
from models import *
import datetime
from unittest.mock import patch, MagicMock

class TestApp(flask_testing.TestCase):
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite://"
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    app.config['TESTING'] = True

    def create_app(self):
        return app

    def setUp(self):
        db.create_all()

        self.employee = Employee(
            staff_id=140008,
            staff_fname="Jaclyn",
            staff_lname="Lee",
            dept="Sales",
            position="Sales Manager",
            country="Singapore",
            email="Jaclyn.Lee@allinone.com.sg",
            reporting_manager=140001,
            role=3
        )

        self.manager = Employee(
            staff_id=140001,
            staff_fname="Derek",
            staff_lname="Tan",
            dept="Sales",
            position="Director",
            country="Singapore",
            email="Derek.Tan@allinone.com.sg",
            reporting_manager=130002,
            role=1
        )

        self.wfh_request1 = WFHRequests(
            request_id='1',
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 9, 15),
            is_am=True,
            is_pm=True,
            request_status='Approved',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Sick"
        )

        self.wfh_request2 = WFHRequests(
            request_id='2',
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 10, 1),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Sick"
        )

        db.session.add(self.employee)
        db.session.add(self.manager)
        db.session.add(self.wfh_request1)
        db.session.add(self.wfh_request2)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

class TestWFHRequests(TestApp):
    # Get all WFH requests for a specific staff id
    def test_wfh_requests_by_staffId(self):
        response = self.client.get("/api/staff/140008/all_wfh_dates", content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [
            {
                'request_id': '1',
                'staff_id': 140008,
                'manager_id': 140001,
                'specific_date': '2024-09-15',
                'is_am': True,
                'is_pm': True,
                'request_status': 'Approved',
                'apply_date': '2024-09-30',
                'request_reason': 'Sick'
            },
            {
                'request_id': '2',
                'staff_id': 140008,
                'manager_id': 140001,
                'specific_date': '2024-10-01',
                'is_am': True,
                'is_pm': True,
                'request_status': 'Pending',
                'apply_date': '2024-09-30',
                'request_reason': 'Sick'
            }
        ])

    # Get WFH requests for a specific staff id in a certain date range
    def test_wfh_requests_by_staffId_range(self):
        response = self.client.get("/api/staff/140008/wfh_requests?start_date=2024-09-01&end_date=2024-09-30", content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [
            {
                'request_id': '1',
                'staff_id': 140008,
                'manager_id': 140001,
                'specific_date': '2024-09-15',
                'is_am': True,
                'is_pm': True,
                'request_status': 'Approved',
                'apply_date': '2024-09-30',
                'request_reason': 'Sick'
            }
        ])

    # Get WFH requests with no records found
    def test_wfh_requests_by_staffId_empty(self):
        response = self.client.get("/api/staff/140001/all_wfh_dates", content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {'message': 'No WFH dates found for this staff member'})

    # Test missing date range parameters
    def test_wfh_requests_missing_date_range(self):
        response = self.client.get("/api/staff/140008/wfh_requests", content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "Please provide both start_date and end_date"})

    # Test no WFH requests found in the given date range
    def test_wfh_requests_by_staffId_range_no_data(self):
        response = self.client.get("/api/staff/140008/wfh_requests?start_date=2025-01-01&end_date=2025-01-31", content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"message": "No WFH requests found for this staff member in the given date range"})

    # Test WFH requests when start_date and end_date are the same
    def test_wfh_requests_by_staffId_same_date(self):
        response = self.client.get("/api/staff/140008/wfh_requests?start_date=2024-09-15&end_date=2024-09-15", content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [
            {
                'request_id': '1',
                'staff_id': 140008,
                'manager_id': 140001,
                'specific_date': '2024-09-15',
                'is_am': True,
                'is_pm': True,
                'request_status': 'Approved',
                'apply_date': '2024-09-30',
                'request_reason': 'Sick'
            }
        ])

    # Test WFH requests with a date range that includes no valid requests
    def test_wfh_requests_by_staffId_range_out_of_bounds(self):
        response = self.client.get("/api/staff/140008/wfh_requests?start_date=2023-09-01&end_date=2023-09-30", content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"message": "No WFH requests found for this staff member in the given date range"})

    # Test getting the entire team schedule for a given staff member
    @patch('util.employee.get_full_team')
    def test_get_team_schedule(self, mock_get_full_team):
        mock_get_full_team.return_value = [self.employee]

        response = self.client.get("/api/team/140008/schedule?start_date=2024-09-01&end_date=2024-09-30", content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [
            {
                "staff_id": 140008,
                "ScheduleDetails": [
                    {
                        "request_id": '1',
                        "staff_id": 140008,
                        "manager_id": 140001,
                        "specific_date": '2024-09-15',
                        "is_am": True,
                        "is_pm": True,
                        "request_status": 'Approved',
                        "apply_date": '2024-09-30',
                        "request_reason": 'Sick'
                    }
                ]
            }
        ])

    # Test missing date range parameters for team schedule
    def test_get_team_schedule_missing_date_range(self):
        response = self.client.get("/api/team/140008/schedule", content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "Please provide both start_date and end_date"})

    # Test invalid staff ID for team schedule
    def test_get_team_schedule_invalid_staff_id(self):
        response = self.client.get("/api/team/999/schedule?start_date=2024-09-01&end_date=2024-09-30", content_type='application/json')
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": "Invalid staff ID"})

    # Test no WFH requests found for team schedule
    @patch('util.employee.get_full_team')
    def test_get_team_schedule_no_data(self, mock_get_full_team):
        mock_get_full_team.return_value = [self.employee]

        response = self.client.get("/api/team/140008/schedule?start_date=2025-01-01&end_date=2025-01-31", content_type='application/json')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json(), [])
    def test_get_team_pending_requests(self):
        # Mock the get_full_team function
        with patch('util.employee.get_full_team') as mock_get_full_team:
            mock_get_full_team.return_value = [self.employee]
            
            response = self.client.get("/api/team-manager/140001/pending-requests", 
                                    content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), {
                "team_size": 1,
                "pending_requests_count": 1,
                "team_pending_requests": [
                    {
                        "staff_id": 140008,
                        "pending_requests": [
                            {
                                "request_id": '2',
                                "staff_id": 140008,
                                "manager_id": 140001,
                                "specific_date": '2024-10-01',
                                "is_am": True,
                                "is_pm": True,
                                "request_status": 'Pending',
                                "apply_date": '2024-09-30',
                                "request_reason": 'Sick'
                            }
                        ]
                    }
                ]
            })

    def test_get_team_pending_requests_no_pending(self):
        # First, let's update the existing pending request to be approved
        pending_request = WFHRequests.query.filter_by(request_id='2').first()
        pending_request.request_status = 'Approved'
        db.session.commit()

        # Create a new WFH request with 'Approved' status
        approved_request = WFHRequests(
            request_id='3',
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 10, 2),
            is_am=True,
            is_pm=True,
            request_status='Approved',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Doctor's Appointment"
        )
        db.session.add(approved_request)
        db.session.commit()

        # Mock the get_full_team function to return both team members
        with patch('util.employee.get_full_team') as mock_get_full_team:
            # Set up mock to return both team members
            mock_get_full_team.return_value = [self.manager, self.employee]
            
            response = self.client.get("/api/team-manager/130002/pending-requests", 
                                    content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            expected_response = {
                "team_size": 2,
                "pending_requests_count": 0,
                "team_pending_requests": []
            }
            self.assertEqual(response.get_json(), expected_response)

        # Reset the request status back to pending for other tests
        pending_request = WFHRequests.query.filter_by(request_id='2').first()
        pending_request.request_status = 'Pending'
        db.session.commit()
        
    def test_get_team_pending_requests_invalid_manager(self):
        # Mock the get_full_team function to return an empty list
        with patch('util.employee.get_full_team') as mock_get_full_team:
            mock_get_full_team.return_value = []
            
            response = self.client.get("/api/team-manager/999999/pending-requests", 
                                    content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), {
                "team_size": 0,
                "pending_requests_count": 0,
                "team_pending_requests": []
            })

    def test_get_team_pending_withdraw_requests_invalid_manager(self):
        with patch('util.employee.get_full_team') as mock_get_full_team:
            mock_get_full_team.return_value = []

            response = self.client.get("/api/team-manager/999999/pending-requests-withdraw", content_type='application/json')

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), {
            "team_size": 0,
            "pending_requests_count": 0,
            "team_pending_requests": []
        })
            
    def test_get_team_pending_withdraw_requests_no_pending(self):
    # First, let's update the existing pending request to be approved
        pending_request = WFHRequests.query.filter_by(request_id='2').first()
        pending_request.request_status = 'Withdrawn'
        db.session.commit()

        # Create a new WFH request with 'Approved' status
        approved_request = WFHRequests(
            request_id='3',
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 10, 2),
            is_am=True,
            is_pm=True,
            request_status='Withdrawn',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Doctor's Appointment"
        )
        db.session.add(approved_request)
        db.session.commit()

        # Mock the get_full_team function to return both team members
        with patch('util.employee.get_full_team') as mock_get_full_team:
            # Set up mock to return both team members
            mock_get_full_team.return_value = [self.manager, self.employee]
            
            response = self.client.get("/api/team-manager/130002/pending-requests-withdraw", 
                                    content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            expected_response = {
                "team_size": 2,
                "pending_requests_count": 0,
                "team_pending_requests": []
            }
            self.assertEqual(response.get_json(), expected_response)

        # Reset the request status back to pending for other tests
        pending_request = WFHRequests.query.filter_by(request_id='2').first()
        pending_request.request_status = 'Pending'
        db.session.commit()

    def test_get_team_pending_withdraw_requests(self):
        pending_withdraw_request = WFHRequests(
            request_id='3',
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 10, 2),
            is_am=True,
            is_pm=True,
            request_status='Pending_Withdraw',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="NIL"
        )
        db.session.add(pending_withdraw_request)
        db.session.commit()

        # Mock the get_full_team function
        with patch('util.employee.get_full_team') as mock_get_full_team:
            mock_get_full_team.return_value = [self.employee]
            
            response = self.client.get("/api/team-manager/140001/pending-requests-withdraw", 
                                    content_type='application/json')
            
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json(), {
                "team_size": 1,
                "pending_requests_count": 1,
                "team_pending_requests": [
                    {
                        "staff_id": 140008,
                        "pending_requests": [
                            {
                                "request_id": '3',
                                "staff_id": 140008,
                                "manager_id": 140001,
                                "specific_date": '2024-10-02',
                                "is_am": True,
                                "is_pm": True,
                                "request_status": 'Pending_Withdraw',
                                "apply_date": '2024-09-30',
                                "request_reason": 'NIL'
                            }
                        ]
                    }
                ]
            })
    

if __name__ == '__main__':
    unittest.main()