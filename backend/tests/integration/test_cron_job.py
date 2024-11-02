import unittest
from unittest.mock import patch
from datetime import date
import flask_testing
from server import app, db
from models import * 

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

        db.session.add(employee)
        db.session.add(manager)
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()

@patch('app.task.date')
class TestStaffApply(TestApp):
    def test_auto_reject_more_than_2mths(self, mock_date):
        mock_date.today.return_value = date(2024, 12, 12)
        wfh_request = WFHRequests(
            request_id="1",
            staff_id=140008,
            manager_id=140001,
            specific_date=date(2024, 9, 15),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=date(2024, 9, 12),
            request_reason='Personal matters'
        )

        db.session.add(wfh_request)
        db.session.commit()

        from app.task import auto_reject
        auto_reject()

        pending = WFHRequests.query.filter_by(request_status="Pending").all()
        cancelled = WFHRequests.query.filter_by(request_status="Cancelled").all()

        self.assertEqual(cancelled[0].json(), {
            'request_id': "1",
            'staff_id': 140008,
            'manager_id': 140001,
            'specific_date': "2024-09-15",
            'is_am': True,
            'is_pm': True,
            "request_status": "Cancelled",
            'apply_date': "2024-09-12",
            'request_reason': "Auto-rejected by system"
            })
        self.assertEqual(pending, [])

    def test_auto_reject_less_than_2mths(self, mock_date):
        mock_date.today.return_value = date(2024, 12, 12)
        wfh_request = WFHRequests(
            request_id="1",
            staff_id=140008,
            manager_id=140001,
            specific_date=date(2024, 9, 15),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=date(2024, 11, 12),
            request_reason='Personal matters'
        )

        db.session.add(wfh_request)
        db.session.commit()

        from app.task import auto_reject
        auto_reject()

        pending = WFHRequests.query.filter_by(request_status="Pending").all()
        cancelled = WFHRequests.query.filter_by(request_status="Cancelled").all()

        self.assertEqual(pending[0].json(), {
            'request_id': "1",
            'staff_id': 140008,
            'manager_id': 140001,
            'specific_date': "2024-09-15",
            'is_am': True,
            'is_pm': True,
            "request_status": "Pending",
            'apply_date': "2024-11-12",
            'request_reason': "Personal matters"
            })
        self.assertEqual(cancelled, [])

    def test_auto_reject_boundary(self, mock_date):
        mock_date.today.return_value = date(2024, 12, 12)
        wfh_request = WFHRequests(
            request_id="1",
            staff_id=140008,
            manager_id=140001,
            specific_date=date(2024, 9, 15),
            is_am=True,
            is_pm=True,
            request_status='Pending',
            apply_date=date(2024, 10, 12),
            request_reason='Personal matters'
        )

        db.session.add(wfh_request)
        db.session.commit()

        from app.task import auto_reject
        auto_reject()

        pending = WFHRequests.query.filter_by(request_status="Pending").all()
        cancelled = WFHRequests.query.filter_by(request_status="Cancelled").all()

        self.assertEqual(pending[0].json(), {
            'request_id': "1",
            'staff_id': 140008,
            'manager_id': 140001,
            'specific_date': "2024-09-15",
            'is_am': True,
            'is_pm': True,
            "request_status": "Pending",
            'apply_date': "2024-10-12",
            'request_reason': "Personal matters"
            })
        self.assertEqual(cancelled, [])

if __name__ == '__main__':
    unittest.main()
