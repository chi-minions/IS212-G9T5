import unittest
import flask_testing
import json
from datetime import datetime, date
# from backend import server
from server import app, db
from models import *
from datetime import timedelta

class TestApp(flask_testing.TestCase):
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite://"
    app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {}
    app.config['TESTING'] = True

    def create_app(self):
        return app

    def setUp(self):
        db.create_all()

        self.manager = Employee(
            staff_id=140001,
            staff_fname="Derek",
            staff_lname="Tan",
            dept="Sales",
            position="Director",
            country="Singapore",
            email="Derek.Tan@allinone.com.sg",
            reporting_manager=None,  
            role=1
        )
        self.manager_2 = Employee(
            staff_id=140002,
            staff_fname="Jakobson",
            staff_lname="Tan",
            dept="HR",
            position="Director",
            country="Singapore",
            email="Jakobson@allinone.com.sg",
            reporting_manager=None,  
            role=1
        )

        self.employee_1 = Employee(
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
        self.employee_2 = Employee(
            staff_id=140009,
            staff_fname="John",
            staff_lname="Doe",
            dept="Sales",
            position="Sales Associate",
            country="Singapore",
            email="John.Doe@allinone.com.sg",
            reporting_manager=140001,
            role=3
        )
        self.employee_3=Employee(
            staff_id=140010, 
            staff_fname='Sophia', 
            staff_lname='Toh', 
            dept='Sales', 
            position="Sales Manager", 
            country="Singapore",
            email="Sophia.Toh@allinone.com.sg",
            reporting_manager=140001,
            role=3
        )
        self.employee_4=Employee(
            staff_id=140011,
            staff_fname='Joseph',
            staff_lname='Tan',
            dept='Sales',
            position="Sales Manager", 
            country="Singapore",
            email="josephtan@allinone.come.sg",
            reporting_manager=140001,
            role=3
        )

        db.session.add(self.manager)
        db.session.add(self.manager_2)
        db.session.add(self.employee_1)
        db.session.add(self.employee_2)
        db.session.add(self.employee_3)
        db.session.add(self.employee_4)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

    def test_manager_approve_withdrawal_success(self):
        wfh_request_1 = WFHRequests(
            request_id=1,
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.strptime("2024-09-15", '%Y-%m-%d'),
            request_status='Pending_Withdraw',
            apply_date=date(2024, 9, 30),
            request_reason='Personal matters',
            is_am=False,
            is_pm=True
        )
        db.session.add(wfh_request_1)
        db.session.commit()

        request_body = {
            "request_id": 1,
            "specific_date": "2024-09-15",
            "manager_id": 140001,
            "decision_status": "Approved",
            "decision_notes": "Approved by manager"
        }
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()['message'], "Withdrawal request updated and manager's decision stored successfully")
        self.assertEqual(response.get_json()["request"],{
            "request_id": "1",
            "specific_date": "2024-09-15",
            "staff_id": 140008,
            "manager_id": 140001,
            "is_am": False,
            "is_pm": True,
            "request_status": "Withdrawn",
            "apply_date": "2024-09-30",
            "request_reason": "Personal matters"
        })
        self.assertEqual(response.get_json()["decision"], {
            "withdraw_decision_id": 1,
            "request_id": "1",
            "specific_date": "2024-09-15",
            "manager_id": 140001,
            "decision_date": str(datetime.now().date()),
            "decision_status": "Approved",
            "decision_notes": "Approved by manager"
        })

    def test_manager_approve_withdrawal_invalid_json(self):
        request_body = {}
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "Invalid JSON or no data provided"})

    def test_manager_approve_withdrawal_request_not_found(self):
        request_body = {
            "request_id": 999,
            "specific_date": "2024-09-15",
            "manager_id": 140001,
            "decision_status": "Approved",
            "decision_notes": "Approved by manager"
        }
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": "Request not found"})

    def test_manager_approve_withdrawal_manager_id_not_found(self):
        wfh_request_1 = WFHRequests(
            request_id=1,
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.strptime("2024-09-15", '%Y-%m-%d'),
            request_status='Pending_Withdraw',
            apply_date=date(2024, 9, 30),
            request_reason='Personal matters',
            is_am=False,
            is_pm=True
        )
        db.session.add(wfh_request_1)
        db.session.commit()
        request_body = {
            "request_id": 1,  
            "specific_date": "2024-09-15",
            "manager_id": 999999,  # Using an invalid/non-existent manager ID
            "decision_status": "Approved",
            "decision_notes": "Approved by manager"
        }
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json(), {"error": f"Reporting manager not found"})

    def test_manager_approve_withdrawal_wrong_manager_id(self):
        wfh_request_1 = WFHRequests(
            request_id=1,
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.strptime("2024-09-15", '%Y-%m-%d'),
            request_status='Pending_Withdraw',
            apply_date=date(2024, 9, 30),
            request_reason='Personal matters',
            is_am=False,
            is_pm=True
        )
        db.session.add(wfh_request_1)
        db.session.commit()
        request_body = {
            "request_id": 1,  
            "specific_date": "2024-09-15",
            "manager_id": 140002,  # Using wrong manager ID
            "decision_status": "Approved",
            "decision_notes": "Approved by manager"
        }
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": f"Employee {wfh_request_1.staff_id} reports under {wfh_request_1.manager_id} instead of {request_body['manager_id']}"})

    def test_manager_approve_withdrawal_wrong_status(self):
        wfh_request_1 = WFHRequests(
            request_id=1,
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.strptime("2024-09-15", '%Y-%m-%d'),
            request_status='Approved',
            apply_date=date(2024, 9, 30),
            request_reason='Personal matters',
            is_am=False,
            is_pm=True
        )
        db.session.add(wfh_request_1)
        db.session.commit()
        request_body = {
            "request_id": 1,  
            "specific_date": "2024-09-15",
            "manager_id": 140001, 
            "decision_status": "Approved",
            "decision_notes": "Approved by manager"
        }
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": f"Manager cannot approve or reject request with {wfh_request_1.request_status} status"})

    def test_manager_approve_withdrawal_invalid_decision_status(self):
        wfh_request_1 = WFHRequests(
            request_id=1,
            staff_id=140008,
            manager_id=140001,
            specific_date=datetime.strptime("2024-09-15", '%Y-%m-%d'),
            request_status='Pending_Withdraw',
            apply_date=date(2024, 9, 30),
            request_reason='Personal matters',
            is_am=False,
            is_pm=True
        )
        db.session.add(wfh_request_1)
        db.session.commit()
        request_body = {
            "request_id": 1,  
            "specific_date": "2024-09-15",
            "manager_id": 140001, 
            "decision_status": "",
            "decision_notes": "Approved by manager"
        }
        response = self.client.post('/api/approve_withdrawal', 
                                    data=json.dumps(request_body), 
                                    content_type='application/json')
        
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json(), {"error": f"Invalid decision status"})



if __name__ == '__main__':
    unittest.main()
