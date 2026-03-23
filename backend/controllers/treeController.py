from flask import Blueprint,jsonify, request
from services.flightTreeService import TreeService

tree_bp = Blueprint("tree", __name__)

@tree_bp.route("", methods=["POST"])
def create_tree():
    data = request.get_json()
    service = TreeService()
    
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

