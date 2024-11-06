from flask import Blueprint, jsonify, request
from models import *
from util.wfh_requests import *
from util.request_decisions import *
from util.wfh_dates import *
from util.wfh_request_logs import *
from util.withdraw_decision import *
from datetime import timedelta
from datetime import date
from sqlalchemy import and_

approve = Blueprint('approve', __name__)

@approve.route("/api/approve", methods=['POST'])
def manager_approve_adhoc():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON or no data provided"}), 400
    
    required_fields = ["request_id", "decision_status", "decision_notes", "manager_id"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing '{field}' in request"}), 400

    try:
        request_id = data["request_id"]
        req = get_request_by_id(request_id)
        if not req:
            return jsonify({"error": "Request not found"}), 404
        
        staff_id = req["staff_id"]
        employee = Employee.query.filter_by(staff_id=staff_id).first()
        if not employee: 
            return jsonify({"error": f"Employee with staff_id {staff_id} not found"}), 404
        
        reporting_manager_id = data["manager_id"] #checks if managerid from payload is a valid employee
        manager = Employee.query.filter_by(staff_id=reporting_manager_id).first()
        if not manager:
            return jsonify({"error": f"Reporting manager for employee {staff_id} not found"}), 404
        
        print((employee.reporting_manager))
        print((data["manager_id"]))
        if str(employee.reporting_manager) != str(reporting_manager_id): #checks if managerid from payload is the manager of employee
            return jsonify({"error": f"Employee {staff_id} reports under {employee.reporting_manager} instead of {reporting_manager_id}"}), 400
        
        request_status = req["request_status"]
        if request_status != "Pending":
            return jsonify({"error": f"Manager cannot approve or reject request with {request_status} status"}), 400

        if data["decision_status"] == "Approved":
            ###### head count check ######
            employees_under_same_manager = Employee.query.filter_by(reporting_manager=reporting_manager_id).all()
            total_employees = len(employees_under_same_manager)
            
            start_date = req["specific_date"]
            is_am = req["is_am"]
            is_pm = req["is_pm"]

            if is_am:
                approved_am_requests = WFHRequests.query.filter(
                    and_(
                        WFHRequests.staff_id.in_([emp.staff_id for emp in employees_under_same_manager]),
                        WFHRequests.specific_date == start_date,
                        WFHRequests.request_status.in_(['Approved', 'Pending_Withdraw']),
                        WFHRequests.is_am == True  # Check for AM session
                    )
                ).count()

                if total_employees > 0:
                    ratio_am = (approved_am_requests + 1) / total_employees
                else:
                    ratio_am = 0

                if ratio_am > 0.5:
                    return jsonify({"error": "Exceed 0.5 rule limit for AM session"}), 422

            if is_pm:
                approved_pm_requests = WFHRequests.query.filter(
                    and_(
                        WFHRequests.staff_id.in_([emp.staff_id for emp in employees_under_same_manager]),
                        WFHRequests.specific_date == start_date,
                        WFHRequests.request_status.in_(['Approved', 'Pending_Withdraw']),
                        WFHRequests.is_pm == True  # Check for PM session
                    )
                ).count()

                if total_employees > 0:
                    ratio_pm = (approved_pm_requests + 1) / total_employees
                else:
                    ratio_pm = 0

                if ratio_pm > 0.5:
                    return jsonify({"error": "Exceed 0.5 rule limit for PM session"}), 422

            ###### end of head count check ######

        new_req = update_request(request_id, start_date, {"request_status": data.get("decision_status")})
        if new_req is None:
            return jsonify({"error": "Request not found"}), 404
        
        data["specific_date"] = datetime.strptime(start_date, '%Y-%m-%d').date()
        decision = create_request_decision(data)
        if "error" in decision:
            return jsonify(decision), 500 
        
        log_wfh_request(new_req["new_request"]) # add to wfhrequestlogs

        return jsonify({
            "message": "Request updated and manager's decision stored successfully",
            "request": new_req["new_request"],
            "decision": decision["decision"]
        }), 201

    except Exception as e:
        db.session.rollback() 
        return jsonify({"error": str(e)}), 500

@approve.route("/api/approve_recurring", methods=['POST'])

def manager_approve_recurring():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid JSON or no data provided"}), 400

    required_fields = ["request_id", "decision_status", "decision_notes", "manager_id"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing '{field}' in request"}), 400

    try:
        request_id = data["request_id"]
        req = get_request_by_id(request_id)
        if not req:
            return jsonify({"error": "Request not found"}), 404

        if data["decision_status"] == "Approved":
            ####### Start of headcount check #######
            staff_id = req["staff_id"]
            employee = Employee.query.filter_by(staff_id=staff_id).first()

            reporting_manager_id = employee.reporting_manager

            employees_under_same_manager = Employee.query.filter_by(reporting_manager=reporting_manager_id).all()
            total_employees = len(employees_under_same_manager)

            same_request = WFHRequests.query.filter_by(request_id=request_id).all()

            for arrangement in same_request:
                arrangement_date = arrangement.specific_date
                arrangement_is_am = arrangement.is_am
                arrangement_is_pm = arrangement.is_pm
                if arrangement_is_am:
                    approved_am_requests = WFHRequests.query.filter(
                        and_(
                            WFHRequests.staff_id.in_([emp.staff_id for emp in employees_under_same_manager]),
                            WFHRequests.specific_date == arrangement_date,
                            WFHRequests.request_status.in_(['Approved', 'Pending_Withdraw']),
                            WFHRequests.is_am == True  # Check for AM session
                        )
                    ).count()

                    if total_employees > 0:
                        ratio_am = (approved_am_requests + 1) / total_employees
                    else:
                        ratio_am = 0

                    if ratio_am > 0.5:
                        return jsonify({"error": "Exceed 0.5 rule limit for AM session"}), 422

                if arrangement_is_pm:
                    approved_pm_requests = WFHRequests.query.filter(
                        and_(
                            WFHRequests.staff_id.in_([emp.staff_id for emp in employees_under_same_manager]),
                            WFHRequests.specific_date == arrangement_date,
                            WFHRequests.request_status.in_(['Approved', 'Pending_Withdraw']),
                            WFHRequests.is_pm == True  # Check for PM session
                        )
                    ).count()

                    if total_employees > 0:
                        ratio_pm = (approved_pm_requests + 1) / total_employees
                    else:
                        ratio_pm = 0

                    if ratio_pm > 0.5:
                        return jsonify({"error": "Exceed 0.5 rule limit for PM session"}), 422
            
        for arrangement in same_request:
            arrangement_date = arrangement.specific_date
            data["specific_date"] = arrangement_date
            decision = create_request_decision(data)

            if "error" in decision:
                return jsonify({"error": f"Error creating decision for arrangement {arrangement}: {decision['error']}"}), 500
            
            updated_request = update_request(request_id, arrangement_date, {"request_status": data.get("decision_status")})
            log_wfh_request(updated_request["new_request"]) # add to wfhrequestlogs

        return jsonify({
            "message": "Recurring WFH requests processed successfully",
            "request": req,
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@approve.route("/api/approve_withdrawal", methods=["POST"])
def manager_approve_withdrawal():
    data = request.get_json()
    if not data: 
        return jsonify({"error": "Invalid JSON or no data provided"}), 400
    
    required_fields = ["request_id","specific_date", 'decision_status', "decision_notes", "manager_id"]
    for field in required_fields: 
        if field not in data: 
            return jsonify({"error": f"Missing '{field}' in request"}),400
    
    try:
        request_id = data["request_id"]
        specific_date = data['specific_date']
        req = get_request(request_id, specific_date)
        if not req: 
            return jsonify({"error": "Request not found"}), 400

        staff_id = req["staff_id"]
        employee = Employee.query.filter_by(staff_id=staff_id).first()
        if not employee: 
            return jsonify({"error": f"Employee with staff_id {staff_id} not found"}), 404
        
        reporting_manager_id = data["manager_id"]
        manager = Employee.query.filter_by(staff_id=reporting_manager_id).first()
        if not manager: 
            return jsonify({"error": f"Reporting manager not found"}), 404
        if manager.staff_id != req["manager_id"]:
            return jsonify({"error": f"Employee {staff_id} reports under {req['manager_id']} instead of {data['manager_id']}"}), 400
        
        request_status = req["request_status"]
        if request_status != "Pending_Withdraw":
            return jsonify({"error": f"Manager cannot approve or reject request with {request_status} status"}), 400
        
        decision_status = data["decision_status"]
        if decision_status == "Approved": 
            updated_status = "Withdrawn"
        elif decision_status == "Rejected":
            updated_status = "Approved"
        else: 
            return jsonify({"error": "Invalid decision status"}), 400
        
        new_req = update_request(request_id, req["specific_date"], {"request_status": updated_status})
        if new_req is None:
            return jsonify({"error": "Request update failed"}), 500
        
        decision = create_withdraw_decision(data)
        # print("Decision returned:", decision)
        if "error" in decision:
            return jsonify(decision), 500
        
        return jsonify({
            "message": "Withdrawal request updated and manager's decision stored successfully",
            "request": new_req["new_request"],
            "decision": decision
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500
        
