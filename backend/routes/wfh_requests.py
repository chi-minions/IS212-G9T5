from flask import Blueprint, jsonify, request
from models import *
from datetime import datetime, timedelta
from util.employee import get_full_team, get_staff_below

dates = Blueprint('dates', __name__)

##### WFHREQUESTDATES TABLE #####
# Get all wfh dates for a certain staff id
# GET /api/staff/1/all_wfh_dates
# [
#   {
#     "request_id": 1,
#     "staff_id": 1,
#     "manager_id": 2,
#     "specific_date": "2024-09-24",
#     "is_am": true,
#     "is_pm": true
#     "request_status": "Approved",
#     "apply_date": "2024-09-01",
#     "request_reason": "Sick"
#   }
# ]
@dates.route("/api/staff/<int:staff_id>/all_wfh_dates", methods=["GET"])
def get_staff_wfh_dates(staff_id):

    wfh_requests = WFHRequests.query.filter_by(staff_id=staff_id).all()

    if not wfh_requests:
        return jsonify({"message": "No WFH dates found for this staff member"}), 404

    return jsonify([date_request.json() for date_request in wfh_requests])

# Get all approved wfh dates for a certain staff id in a certain date range
#GET /api/staff/1/wfh_requests?start_date=2024-09-01&end_date=2024-09-30
# [
#   {
#     "request_id": 1,
#     "staff_id": 1,
#     "manager_id": 2,
#     "specific_date": "2024-09-24",
#     "is_am": true,
#     "is_pm": true
#     "request_status": "Approved",
#     "apply_date": "2024-09-01",
#     "request_reason": "Sick"
#   }
# ]


@dates.route("/api/staff/<int:staff_id>/wfh_requests", methods=["GET"])
def get_staff_wfh_requests_in_range(staff_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({"error": "Please provide both start_date and end_date"}), 400

    # Query WFH requests within the date range for the given staff_id
    wfh_requests = WFHRequests.query.filter(
        WFHRequests.staff_id == staff_id,
        WFHRequests.specific_date >= start_date,
        WFHRequests.specific_date <= end_date,
        WFHRequests.request_status == "Approved"  
    ).all()

    if not wfh_requests:
        return jsonify({"message": "No WFH requests found for this staff member in the given date range"}), 404

    return jsonify([date_request.json() for date_request in wfh_requests])

# Get the entire team schedule of a given staff member
# GET /api/team/1/schedule?start_date=2024-09-01&end_date=2024-09-30
@dates.route("/api/team/<int:staff_id>/schedule", methods=["GET"])
def get_team_schedule(staff_id):
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not start_date or not end_date:
        return jsonify({"error": "Please provide both start_date and end_date"}), 400

    # Find the employee and their reporting manager
    staff_member = Employee.query.filter_by(staff_id=staff_id).first()
    if not staff_member:
        return jsonify({"error": "Invalid staff ID"}), 404

    reporting_manager_id = staff_member.reporting_manager

    # Get the full team under the reporting manager
    # team = get_full_team(reporting_manager_id)
    team = get_staff_below(reporting_manager_id)

    # Prepare the schedule for each team member
    team_schedule = []
    for team_member in team:
        # Get the approved WFH requests within the given date range
        wfh_requests = WFHRequests.query.filter(
            WFHRequests.staff_id == team_member.staff_id,
            WFHRequests.specific_date >= start_date,
            WFHRequests.specific_date <= end_date,
            WFHRequests.request_status == "Approved"
        ).all()

        # Create the schedule details for the current team member
        schedule_details = [
            {
                "request_id": request_entry.request_id,
                "staff_id": request_entry.staff_id,
                "manager_id": request_entry.manager_id,
                "specific_date": request_entry.specific_date.strftime("%Y-%m-%d"),
                "is_am": request_entry.is_am,
                "is_pm": request_entry.is_pm,
                "request_status": request_entry.request_status,
                "apply_date": request_entry.apply_date.strftime("%Y-%m-%d"),
                "request_reason": request_entry.request_reason
            } for request_entry in wfh_requests
        ]

        if schedule_details:
            # Add the team member's schedule only if they have schedule details
            team_schedule.append({
                "staff_id": team_member.staff_id,
                "ScheduleDetails": schedule_details
            })

    return jsonify(team_schedule), 200

@dates.route("/api/team-manager/<int:manager_id>/pending-requests", methods=["GET"])
def get_team_pending_requests(manager_id):
    # Get the full team under the given manager
    team = get_full_team(manager_id)

    # Prepare the pending requests for each team member
    team_pending_requests = []
    for team_member in team:
        # Get all pending WFH requests without a date filter
        pending_requests = WFHRequests.query.filter(
            WFHRequests.staff_id == team_member.staff_id,
            WFHRequests.request_status == "Pending"
        ).order_by(WFHRequests.specific_date.asc()).all()

        # Create the request details for the current team member
        request_details = [
            {
                "request_id": request.request_id,
                "staff_id": request.staff_id,
                "manager_id": request.manager_id,
                "specific_date": request.specific_date.strftime("%Y-%m-%d"),
                "is_am": request.is_am,
                "is_pm": request.is_pm,
                "request_status": request.request_status,
                "apply_date": request.apply_date.strftime("%Y-%m-%d"),
                "request_reason": request.request_reason,
            } for request in pending_requests
        ]

        if request_details:
            # Add the team member's pending requests only if they have any
            team_pending_requests.append({
                "staff_id": team_member.staff_id,
                "pending_requests": request_details
            })

    return jsonify({
        "team_size": len(team),
        "pending_requests_count": sum(len(member["pending_requests"]) for member in team_pending_requests),
        "team_pending_requests": team_pending_requests
    }), 200

@dates.route("/api/team-manager/<int:manager_id>/pending-requests-withdraw", methods=["GET"])
def get_team_pending_withdraw_requests(manager_id):
    # Get the full team under the given manager
    team = get_full_team(manager_id)

    # Prepare the pending requests for each team member
    team_pending_requests = []
    for team_member in team:
        # Get all pending WFH requests without a date filter
        pending_requests = WFHRequests.query.filter(
            WFHRequests.staff_id == team_member.staff_id,
            WFHRequests.request_status == "Pending_Withdraw"
        ).order_by(WFHRequests.specific_date.asc()).all()

        # Create the request details for the current team member
        request_details = [
            {
                "request_id": request.request_id,
                "staff_id": request.staff_id,
                "manager_id": request.manager_id,
                "specific_date": request.specific_date.strftime("%Y-%m-%d"),
                "is_am": request.is_am,
                "is_pm": request.is_pm,
                "request_status": request.request_status,
                "apply_date": request.apply_date.strftime("%Y-%m-%d"),
                "request_reason": request.request_reason,
            } for request in pending_requests
        ]

        if request_details:
            # Add the team member's pending requests only if they have any
            team_pending_requests.append({
                "staff_id": team_member.staff_id,
                "pending_requests": request_details
            })

    return jsonify({
        "team_size": len(team),
        "pending_requests_count": sum(len(member["pending_requests"]) for member in team_pending_requests),
        "team_pending_requests": team_pending_requests
    }), 200
