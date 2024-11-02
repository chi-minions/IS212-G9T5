import unittest
import json
from flask_testing import TestCase
from server import app, db
from models import Employee, WFHRequests
import datetime

class TestManagerTeamSchedule(TestCase):
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite://"
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    app.config['TESTING'] = True

    def create_app(self):
        return app

    def setUp(self):
        db.create_all()
        # Adding employee records
        employees = [
            {"staff_id": 130002, "staff_fname": "Jack", "staff_lname": "Sim", "dept": "CEO", "position": "MD", "country": "Singapore", "email": "jack.sim@allinone.com.sg", "reporting_manager": 130002, "role": 1},
            {"staff_id": 140001, "staff_fname": "Derek", "staff_lname": "Tan", "dept": "Sales", "position": "Director", "country": "Singapore", "email": "Derek.Tan@allinone.com.sg", "reporting_manager": 130002, "role": 1},
            {"staff_id": 140008, "staff_fname": "Jaclyn", "staff_lname": "Lee", "dept": "Sales", "position": "Sales Manager", "country": "Singapore", "email": "Jaclyn.Lee@allinone.com.sg", "reporting_manager": 140001, "role": 3},
            {"staff_id": 140894, "staff_fname": "Rahim", "staff_lname": "Khalid", "dept": "Sales", "position": "Sales Manager", "country": "Singapore", "email": "Rahim.Khalid@allinone.com.sg", "reporting_manager": 140001, "role": 3},
            # Add more employees as required for testing
        ]
        
        for emp in employees:
            employee = Employee(
                staff_id=emp["staff_id"],
                staff_fname=emp["staff_fname"],
                staff_lname=emp["staff_lname"],
                dept=emp["dept"],
                position=emp["position"],
                country=emp["country"],
                email=emp["email"],
                reporting_manager=emp["reporting_manager"],
                role=emp["role"]
            )
            db.session.add(employee)
        
        # Adding approved WFH requests within date range for the test
        wfh_requests = [
            {
                "request_id": '1', "staff_id": 140008, "manager_id": 140001,
                "specific_date": datetime.date(2024, 9, 15), "is_am": True, "is_pm": False,
                "request_status": "Approved", "apply_date": datetime.date(2024, 9, 10), "request_reason": "Family emergency"
            },
            {
                "request_id": '2', "staff_id": 140894, "manager_id": 140001,
                "specific_date": datetime.date(2024, 9, 16), "is_am": False, "is_pm": True,
                "request_status": "Approved", "apply_date": datetime.date(2024, 9, 12), "request_reason": "Doctor appointment"
            }
        ]
        
        for req in wfh_requests:
            wfh_request = WFHRequests(
                request_id=req["request_id"],
                staff_id=req["staff_id"],
                manager_id=req["manager_id"],
                specific_date=req["specific_date"],
                is_am=req["is_am"],
                is_pm=req["is_pm"],
                request_status=req["request_status"],
                apply_date=req["apply_date"],
                request_reason=req["request_reason"]
            )
            db.session.add(wfh_request)
        
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_get_manager_team_schedule(self):
        self.maxDiff = None
        # Define the manager's ID and date range for the query
        manager_id = 140001
        start_date = "2024-09-01"
        end_date = "2024-09-30"

        response = self.client.get(f"/api/manager/{manager_id}/team_schedule?start_date={start_date}&end_date={end_date}")
        self.assertEqual(response.status_code, 200)

        # Expected output based on the data provided
        expected_output = {
            "staff": {
                "staff_id": 140001,
                "ScheduleDetails": []
            },
            "team": [
                {
                    "staff_id": 140008,
                    "ScheduleDetails": [
                        {
                            "request_id": '1',
                            "staff_id": 140008,
                            "specific_date": "2024-09-15",
                            "is_am": True,
                            "is_pm": False
                        }
                    ]
                },
                {
                    "staff_id": 140894,
                    "ScheduleDetails": [
                        {
                            "request_id": '2',
                            "staff_id": 140894,
                            "specific_date": "2024-09-16",
                            "is_am": False,
                            "is_pm": True
                        }
                    ]
                }
            ]
        }

        # Check that the response data matches the expected output
        self.assertEqual(response.json, expected_output)

    def test_missing_date_parameters(self):
        """Test missing date parameters"""
        manager_id = 140001
        response = self.client.get(f"/api/manager/{manager_id}/team_schedule")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json, {"error": "Please provide both start_date and end_date"})

    def test_invalid_date_format(self):
        """Test invalid date format"""
        manager_id = 140001
        start_date = "2024-09"
        end_date = "2024-09-30"
        response = self.client.get(f"/api/manager/{manager_id}/team_schedule?start_date={start_date}&end_date={end_date}")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json, {"error": "Invalid date format, please use YYYY-MM-DD"})

    def test_no_team_members(self):
        """Test manager with no team members"""
        manager_id = 999999  # Invalid manager with no team
        start_date = "2024-09-01"
        end_date = "2024-09-30"
        response = self.client.get(f"/api/manager/{manager_id}/team_schedule?start_date={start_date}&end_date={end_date}")
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json, {"message": "No team members found under this manager"})

    def test_team_member_with_no_schedule(self):
        """Test team member with no schedule"""
        # Adding a team member with no WFH requests in the date range
        new_employee = Employee(
            staff_id=150001,
            staff_fname="Sam",
            staff_lname="Smith",
            dept="Sales",
            position="Sales Executive",
            country="Singapore",
            email="sam.smith@allinone.com.sg",
            reporting_manager=140001,
            role=2
        )
        db.session.add(new_employee)
        db.session.commit()

        manager_id = 140001
        start_date = "2024-09-01"
        end_date = "2024-09-30"
        response = self.client.get(f"/api/manager/{manager_id}/team_schedule?start_date={start_date}&end_date={end_date}")
        self.assertEqual(response.status_code, 200)
        response_data = response.json

        # Check if new team member has no schedule details
        self.assertIn({
            "staff_id": 150001,
            "ScheduleDetails": []
        }, response_data["team"])

    def test_get_all_managers_success(self):
        """Test successful retrieval of managers grouped by department"""
        response = self.client.get('/api/managers')
        self.assertEqual(response.status_code, 200)
        
        data = response.json
        
        # Check that sales department exists (since we have 2 sales managers)
        self.assertIn('sales', data)
        
        # Check correct number of managers in Sales department
        self.assertEqual(len(data['sales']), 2)  # Two sales managers: Jaclyn and Rahim
        
        # Check the managers have correct staff IDs
        sales_managers = data['sales']
        manager_ids = {manager['staff_id'] for manager in sales_managers}
        self.assertIn(140008, manager_ids)  # Jaclyn's ID
        self.assertIn(140894, manager_ids)  # Rahim's ID

    def test_get_all_managers_empty(self):
        """Test when there are no managers in the system"""
        # Clear the database
        db.session.query(Employee).delete()
        db.session.commit()
        
        response = self.client.get('/api/managers')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {})

    def test_get_all_managers_error(self):
        """Test error handling when database query fails"""
        # Force an error by dropping the table
        db.session.remove()
        db.drop_all()
        
        response = self.client.get('/api/managers')
        self.assertEqual(response.status_code, 500)
        self.assertIn('error', response.json)


if __name__ == '__main__':
    unittest.main()
