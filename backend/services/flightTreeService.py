#1) i need first to get the JSON that is created when i press the button in FRONTEND.
#2) then i work to parse and manage that JSON to create the tree. 
#3) then i convert that tree in a JSON format again.
#4) then i connect my service with the respective controller.
#5) then the FRONTEND could consume that service to make the tree's graphic.

from models.AvlTree import AvlTree
from models.BstTree import BstTree
from utils.utils import *
from models.Flight import Flight
from models.Node import Node
from datetime import datetime


class TreeService:
    
    
    def __init__(self):
        self.avl = AvlTree()
        self.bst = BstTree()
    
    # data = readJson("../data/modo_topologia.json"); #this is only for test purposes, data is obtained from the frontend
    def createTree(self, data):
        dataType = data["tipo"]
        
        self._createByType(dataType, data)


    def _createByType(self, dataType, data):
        #reset the trees
        self.avl = AvlTree()
        self.bst = BstTree()
        
        if(dataType.upper()  == "INSERCION"):
            self._createTreeInsertion(data)
        elif(dataType.upper() == "TOPOLOGIA"):
            root = self._createTreeTopology(data)
            self.avl.root = root
        else:
            raise Exception("invalid data type, only INSERTION OR TOPOLOGY allowed")

    def _createTreeTopology(self, data):
        if data is None:
            return None

        flight = Flight(
            idFlight=data["codigo"],
            departureCity=data["origen"],
            arrivalCity=data["destino"],
            departureDate=data["horaSalida"],
            price=data["precioBase"],
            numberPassengers=data["pasajeros"]
        )

        node = Node(flight)

        left_child = self._createTreeTopology(data["izquierdo"])
        right_child = self._createTreeTopology(data["derecho"])
        
        node.setLeftChild(left_child)
        node.setRightChild(right_child)

        
        if left_child:
            left_child.setParent(node)

        if right_child:
            right_child.setParent(node)

        return node

    def _createTreeInsertion(self, data):
        for v in data["vuelos"]:
            flight = Flight(
                idFlight=v["codigo"],
                departureCity=v["origen"],
                arrivalCity=v["destino"],
                departureDate=v["horaSalida"],
                price=v["precioBase"],
                numberPassengers=v["pasajeros"]
            )
            
            node = Node(flight)

            self.avl.insert(node)
            #BST needs to be modified!!
            # self.bst.insert(node)

    def toPrintConsole(self):
        self.avl.print_tree()

    def insertFlight(self, flight):
        node = Node(flight)
        self.avl.insert(node)
    
    def searchFlight(self, flightCode):
        if not flightCode:
            return None
        node = Node(Flight(idFlight=flightCode))
        return self.avl.search(node)
    
    def  deleteFlight(self, flightCode):
        if not flightCode:
            return False

        node = Node(Flight(idFlight=flightCode))

        found = self.avl.search(node)
        if not found:
            return False

        self.avl.delete(node)
        return True
        
    def _nodeToJson(self, node):
        if node is None:
            return None

        flight = node.getValue()

        return {
            "codigo": flight.getIdFlight(),
            "origen": flight.getDepartureCity(),
            "destino": flight.getArrivalCity(),
            "horaSalida": flight.getDepartureDate(),
            "precioBase": flight.getPrice(),
            "pasajeros": flight.getNumberPassengers(),
            "izquierdo": self._nodeToJson(node.getLeftChild()),
            "derecho": self._nodeToJson(node.getRightChild())
        }
        
    
    def getTreeJson(self):
        return self._nodeToJson(self.avl.root)