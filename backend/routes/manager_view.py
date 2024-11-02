from flask import Blueprint, jsonify, request
from models import Employee, WFHRequests
from util.employee import get_full_team  # Assuming this is the path
from datetime import datetime

manager_view = Blueprint('manager_view', __name__)

@manager_view.route('/api/manager/<int:manager_id>/team_schedule', methods=['GET'])
def get_manager_team_schedule(manager_id):
    # Parse the start and end date from query parameters
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')

    if not start_date_str or not end_date_str:
        return jsonify({"error": "Please provide both start_date and end_date"}), 400

    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format, please use YYYY-MM-DD"}), 400

    # Fetch the full hierarchical team for the given manager_id
    full_team = get_full_team(manager_id)

    if not full_team:
        return jsonify({"message": "No team members found under this manager"}), 404

    # Prepare the manager's schedule details
    staff_schedule_details = get_staff_schedule_details(manager_id, start_date, end_date)

    # Prepare the team members' schedules
    team_schedules = []
    for team_member in full_team:
        member_schedule_details = get_staff_schedule_details(team_member.staff_id, start_date, end_date)
        team_schedules.append({
            "staff_id": team_member.staff_id,
            "ScheduleDetails": member_schedule_details
        })

    # Construct the final response
    response = {
        "staff": {
            "staff_id": manager_id,
            "ScheduleDetails": staff_schedule_details
        },
        "team": team_schedules
    }

    return jsonify(response), 200

def get_staff_schedule_details(staff_id, start_date, end_date):
    # Query the WFHRequests table for 'Approved' requests within the date range
    approved_requests = WFHRequests.query.filter(
        WFHRequests.staff_id == staff_id,
        WFHRequests.request_status == 'Approved',
        WFHRequests.specific_date >= start_date,
        WFHRequests.specific_date <= end_date
    ).all()
    

    # Convert the approved requests to JSON format with selected fields
    return [{
        "request_id": request.request_id,
        "staff_id": request.staff_id,
        "specific_date": request.specific_date.strftime("%Y-%m-%d"),
        "is_am": request.is_am,
        "is_pm": request.is_pm
    } for request in approved_requests]

@manager_view.route('/api/managers', methods=['GET'])
def get_all_managers():
    try:
        # Query all employees with role = 3 (managers)
        managers = Employee.query.filter_by(role=3).all()
        
        # Group managers by department
        department_managers = {}
        
        for manager in managers:
            dept = manager.dept.lower()  # Normalize department names
            if dept not in department_managers:
                department_managers[dept] = []
            
            # Count team members
            team_size = Employee.query.filter_by(reporting_manager=manager.staff_id).count()
            
            department_managers[dept].append({
                'staff_id': manager.staff_id,
                'teamSize': team_size
            })
        
        return jsonify(department_managers), 200
    
    except Exception as e:
        print(f"Error in get_all_managers: {str(e)}")
        return jsonify({"error": str(e)}), 500
