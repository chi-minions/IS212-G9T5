from models import *
from flask import jsonify

def get_employee_by_id(staff_id):
    employee = Employee.query.filter_by(staff_id=staff_id).first()
    if not employee:
        return None
    return employee.json()

def get_full_team(rm_id):
    team = Employee.query.filter_by(reporting_manager=rm_id).all()
    full_team = team.copy()  # To store the entire hierarchy

    ids = [employee.staff_id for employee in team if employee.role != 2]

    while ids:
        current_rm_id = ids.pop()
        subteam = Employee.query.filter_by(reporting_manager=current_rm_id).all()
        full_team += subteam

        # Add non-role 2 employees to the ids list for further exploration
        ids += [employee.staff_id for employee in subteam if employee.role != 2]
        if current_rm_id == rm_id:
            break
    
    return full_team

def get_staff_below(rm_id):

    team = Employee.query.filter_by(reporting_manager=rm_id).all()

    return team

def get_all_department_teams():
    all_employees = Employee.query.all()

    department_teams = {}

    for employee in all_employees:
        department = employee.dept
        reporting_manager = employee.reporting_manager 

        if department not in department_teams:
            department_teams[department] = {}
        
        if reporting_manager and reporting_manager not in department_teams[department]:
            team = get_full_team(reporting_manager)
            department_teams[department][reporting_manager] = [member.json() for member in team]
            
    
    return department_teams
