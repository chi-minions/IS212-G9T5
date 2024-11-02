import unittest
import flask_testing
from server import app, db
from models import *
import datetime

class TestApp(flask_testing.TestCase):
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite://"
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    app.config['TESTING'] = True

    def create_app(self):
        return app

    def setUp(self):
        db.create_all()
        employee = Employee(
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

        manager = Employee(
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

        wfh_request1 = WFHRequests(
            request_id="REQ001",  # Added request_id
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 9, 15),
            is_am=True,
            is_pm=True,
            request_status='Approved',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Sick"
        )
        
        wfh_request2 = WFHRequests(
            request_id="REQ002",  # Added request_id
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 10, 1),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Sick"
        )

        db.session.add(employee)
        db.session.add(manager)
        db.session.add(wfh_request1)
        db.session.add(wfh_request2)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

class TestGetRequest(TestApp):
    def setUp(self):
        super().setUp()
        # Add a recurring request
        recurring_request1 = WFHRequests(
            request_id="REC123",  # Using consistent request_id for recurring requests
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 11, 1),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=datetime.date(2024, 10, 15),
            request_reason="Regular WFH"
        )
        
        recurring_request2 = WFHRequests(
            request_id="REC123",  # Same request_id for recurring requests
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 11, 8),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=datetime.date(2024, 10, 15),
            request_reason="Regular WFH"
        )

        # Add a single request
        single_request = WFHRequests(
            request_id="SINGLE456",
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.date(2024, 10, 1),
            is_am=True,
            is_pm=False,
            request_status='Pending',
            apply_date=datetime.date(2024, 9, 30),
            request_reason="Doctor's Appointment"
        )

        db.session.add(recurring_request1)
        db.session.add(recurring_request2)
        db.session.add(single_request)
        db.session.commit()

    def test_get_recurring_request(self):
        """Test getting a recurring request returns all associated dates"""
        response = self.client.get("/api/request/REC123", 
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        response_data = response.get_json()
        
        self.assertTrue(response_data["is_recurring"])
        self.assertEqual(len(response_data["all_dates"]), 2)
        
        # Verify the dates are returned in the expected format
        expected_dates = [
            {"specific_date": "2024-11-01", "is_am": True, "is_pm": True},
            {"specific_date": "2024-11-08", "is_am": True, "is_pm": True}
        ]
        self.assertEqual(response_data["all_dates"], expected_dates)
        
        # Verify the main request data
        self.assertEqual(response_data["data"]["request_id"], "REC123")
        self.assertEqual(response_data["data"]["staff_id"], 140008)
        self.assertEqual(response_data["data"]["manager_id"], 140001)
        self.assertEqual(response_data["data"]["request_status"], "Pending")

    def test_get_single_request(self):
        """Test getting a non-recurring request"""
        response = self.client.get("/api/request/SINGLE456", 
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 200)
        response_data = response.get_json()
        
        self.assertFalse(response_data["is_recurring"])
        self.assertEqual(response_data["all_dates"], [])
        
        # Verify the main request data
        expected_data = {
            "request_id": "SINGLE456",
            "staff_id": 140008,
            "manager_id": 140001,
            "specific_date": "2024-10-01",
            "is_am": True,
            "is_pm": False,
            "request_status": "Pending",
            "apply_date": "2024-09-30",
            "request_reason": "Doctor's Appointment"
        }
        
        for key, value in expected_data.items():
            self.assertEqual(response_data["data"][key], value)

    def test_get_nonexistent_request(self):
        """Test attempting to get a request that doesn't exist"""
        response = self.client.get("/api/request/NONEXISTENT", 
                                 content_type='application/json')
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": "Request not found"})

if __name__ == '__main__':
    unittest.main()

# class TestStaffRequests(TestApp):
#     def test_staff_requests(self):
#         response = self.client.get("/api/140008", content_type='application/json')
        
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.get_json()["data"], [{
#                 'request_id': 1,
#                 'staff_id': 140008,
#                 'manager_id': 140001,
#                 'request_type': 'Ad-hoc',
#                 'start_date': "2024-09-15",
#                 'end_date': "2024-09-15",
#                 'recurrence_days': None,
#                 'is_am': True,
#                 'is_pm': True,
#                 "request_status": "Approved",
#                 'apply_date': "2024-09-30",
#                 'withdraw_reason': None,
#                 'request_reason': "Sick"
#                 }, {
#                 'request_id': 2,
#                 'staff_id': 140008,
#                 'manager_id': 140001,
#                 'request_type': 'Ad-hoc',
#                 'start_date': "2024-10-01",
#                 'end_date': "2024-10-01",
#                 'recurrence_days': None,
#                 'is_am': True,
#                 'is_pm': True,
#                 "request_status": "Pending",
#                 'apply_date': "2024-09-30",
#                 'withdraw_reason': None,
#                 'request_reason': "Sick"
#                 }]
#             )
        
#     def test_staff_no_requests(self):
#         response = self.client.get("/api/140001", content_type='application/json')
        
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.get_json()["data"], [])

#     def test_invalid_staff(self):
#         response = self.client.get("/api/0", content_type='application/json')
        
#         self.assertEqual(response.status_code, 404)
#         self.assertEqual(response.get_json(), {"error": "Staff not found"})

#     def test_staff_pending(self):
#         response = self.client.get("/api/140008/pending", content_type='application/json')
        
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.get_json()["data"], [{
#                 'request_id': 2,
#                 'staff_id': 140008,
#                 'manager_id': 140001,
#                 'request_type': 'Ad-hoc',
#                 'start_date': "2024-10-01",
#                 'end_date': "2024-10-01",
#                 'recurrence_days': None,
#                 'is_am': True,
#                 'is_pm': True,
#                 "request_status": "Pending",
#                 'apply_date': "2024-09-30",
#                 'withdraw_reason': None,
#                 'request_reason': "Sick"
#                 }]
#             )
    
#     def test_staff_no_pending(self):
#         response = self.client.get("/api/140001/pending", content_type='application/json')
        
#         self.assertEqual(response.status_code, 200)
#         self.assertEqual(response.get_json()["data"], [])

#     def test_invalid_staff_pending(self):
#         response = self.client.get("/api/0/pending", content_type='application/json')
        
#         self.assertEqual(response.status_code, 404)
#         self.assertEqual(response.get_json(), {"error": "Staff not found"})


