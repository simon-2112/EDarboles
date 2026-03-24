from flask import Blueprint,jsonify, request
from services.flightTreeService import TreeService

tree_bp = Blueprint("tree", __name__)
#global/ basically a stateful API because the state of the tree persist for each request
service = TreeService()

@tree_bp.route("", methods=["POST"])
def create_tree():
    data = request.get_json()
    
    try:
        service.createTree(data)

        result = service.getTreeJson()

        return jsonify({
            "status": "success",
            "data": result
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

@tree_bp.route("/cancel/<flightCode>", methods=["DELETE"])
def cancel_subtree(flightCode):

    try:
        success = service.descendantsCancelation(flightCode)

        if not success:
            return jsonify({
                "status": "error",
                "message": f"Flight {flightCode} not found"
            }), 404

        result = service.getTreeJson()

        return jsonify({
            "status": "success",
            "message": f"Subtree {flightCode} and its descendants were removed",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
