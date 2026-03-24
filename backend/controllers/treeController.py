from flask import Blueprint,jsonify, request
from models.AvlTree import AvlTree
from models.BstTree import BstTree
from services.flightTreeService import TreeService
from models.Flight import Flight

# base route -> http://localhost:5000/api/tree

tree_bp = Blueprint("tree", __name__)

"""
    this is a stateful API because the state of the tree persist for each request,
    there are something to talk about: for this project, the API will be a stateful API, so every USER will affect the tree,
    even /reset endpoint delete the tree globaly, so a solution could be for example create a dictionary of trees, where the
    key could be the user, and the value the respective tree. But actually for this educational project it is not important
    because we assume a single user.
"""

service = TreeService()



#core TREE
@tree_bp.route("", methods=["GET"])
def get_tree():
    try:
        result = service.getTreeJson()

        return jsonify({
            "status": "success",
            "data": result
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

#to create a tree
@tree_bp.route("/create", methods=["POST"])
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

#OPERATIONS
#cancel a node + descendants
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


#to insert a flight
@tree_bp.route("/insert", methods=["POST"])
def insert_flight():
    data = request.get_json()

    try:
        flight = Flight(
            idFlight=data["codigo"],
            departureCity=data["origen"],
            arrivalCity=data["destino"],
            departureDate=data["horaSalida"],
            price=data["precioBase"],
            numberPassengers=data["pasajeros"],
            promotion=data["promocion"],
            alert=data["alerta"],
            priority=data["prioridad"]
        )

        service.insertFlight(flight)

        return jsonify({
            "status": "success",
            "message": "Flight inserted",
            "data": service.getTreeJson()
        }), 201

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400
        

#to search a flight
@tree_bp.route("/search/<flightCode>", methods=["GET"])
def search_flight(flightCode):
    try:
        if node := service.searchFlight(flightCode):
            return jsonify({
                "status": "success",
                "data": service.nodeToJson(node)
            }), 200

        else:
            return jsonify({
                "status": "error",
                "message": "Flight not found"
            }), 404

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

#to delete a flight
@tree_bp.route("/delete/<flightCode>", methods=["DELETE"])
def delete_flight(flightCode):
    try:
        if success := service.deleteFlight(flightCode):
            return jsonify({
                "status": "success",
                "message": "Flight deleted",
                "data": service.getTreeJson()
            }), 200

        else:
            return jsonify({
                "status": "error",
                "message": "Flight not found"
            }), 404

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


#to update a flight completely
@tree_bp.route("/update/<flightCode>", methods=["PUT"])
def update_flight(flightCode):
    data = request.get_json()

    try:
        # eliminar
        deleted = service.deleteFlight(flightCode)

        if not deleted:
            return jsonify({
                "status": "error",
                "message": "Flight not found"
            }), 404

        # insertar nuevo
        flight = Flight(
            idFlight=data["codigo"],
            departureCity=data["origen"],
            arrivalCity=data["destino"],
            departureDate=data["horaSalida"],
            price=data["precioBase"],
            numberPassengers=data["pasajeros"],
            promotion=data["promocion"],
            alert=data["alerta"],
            priority=data["prioridad"]
        )

        service.insertFlight(flight)

        return jsonify({
            "status": "success",
            "message": "Flight updated",
            "data": service.getTreeJson()
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400


#reset / delete all the tree
@tree_bp.route("/reset", methods=["DELETE"])
def reset_tree():
    try:
        service.avl = AvlTree()
        service.bst = BstTree()

        return jsonify({
            "status": "success",
            "message": "Tree reset"
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

#CTRL-Z SYSTEM

@tree_bp.route("/undo", methods=["POST"])
def undo():
    try:
        if success := service.undoAction():
            return jsonify({
                "status": "success",
                "message": "Undo successful",
                "data": service.getTreeJson()
            }), 200

        else:
            return jsonify({
                "status": "error",
                "message": "No actions to undo"
            }), 400

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

