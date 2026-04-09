from models.AvlTree import AvlTree
from models.BstTree import BstTree
from utils.utils import *
from models.Flight import Flight
from models.Node import Node
from models.Stack import Stack
from copy import deepcopy
from services.versionService import VersionService
from services.queueService import QueueService
from services.metricsService import MetricsService
from services.stressModeService import StressService
from services.penaltyService import PenaltyService
from services.auditoryService import AuditoryService
from services.profitService import ProfitService


class TreeService:
    """
    note:
    the @history atribute save every action  (insertion, deletion, cancelation...)
    but is not posible to extract states from history like pop(0) when it is near to 20 or 30 states
    because it violates the Stack structure. (so this is a little inefficient way)
    """

    def __init__(self):
        self.totalCancelations = 0
        self.stressMode = False
        self.avl = AvlTree()
        self.bst = BstTree()
        self.history = Stack()
        self.versionService = VersionService()
        self.queueService = QueueService()
        self.metricsService = MetricsService()
        self.stressService = StressService(self)
        self.penaltyService = PenaltyService(self)
        self.auditoryService = AuditoryService(self)
        self.profitService = ProfitService(self)

    def createTree(self, data):
        self.saveState()
        dataType = data["tipo"]

        self._createByType(dataType, data)

    def _createByType(self, dataType, data):
        # reset the trees
        self.avl = AvlTree()
        self.bst = BstTree()

        if dataType.upper() == "INSERCION":
            self._createTreeInsertion(data)
            self.penaltyService.applyPenalty()
        elif dataType.upper() == "TOPOLOGIA":
            changed = True
            root = self._createTreeTopology(data)
            # to rebalance when we load it.
            root, _ = self.avl.rebalanceFull(root)
            self.avl.root = root
            self.penaltyService.applyPenalty()
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
            numberPassengers=data["pasajeros"],
            promotion=data["promocion"],
            alert=data["alerta"],
            priority=data["prioridad"],
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
                numberPassengers=v["pasajeros"],
                promotion=v["promocion"],
                alert=v["alerta"],
                priority=v["prioridad"],
            )

            # we need 2 different nodes at the start because the node could have the same references and this can break the recursion
            nodeAvl = Node(flight)
            nodeBst = Node(flight)

            self.avl.insert(nodeAvl)
            self.bst.insert(nodeBst)

    def toPrintAvl(self):
        self.avl.print_tree()

    def toPrintBst(self):
        self.bst.print_tree()

    def insertFlight(self, flight):
        self.saveState()
        node = Node(flight)
        self.avl.insert(node, rebalance=not self.stressMode)

        self.penaltyService.applyPenalty()

    def searchFlight(self, flightCode):
        if not flightCode:
            return None
        node = Node(Flight(idFlight=flightCode))
        return self.avl.search(node)

    def deleteFlight(self, flightCode):
        if not flightCode:
            return False

        node = Node(Flight(idFlight=flightCode))

        found = self.avl.search(node)
        if not found:
            return False

        self.saveState()
        self.avl.delete(node, rebalance=not self.stressMode)

        self.penaltyService.applyPenalty()
        return True

    def descendantsCancelation(self, flightCode):
        if not flightCode:
            return False
        node = Node(Flight(idFlight=flightCode))

        nodeToCancel = self.avl.search(node)
        if nodeToCancel is None:
            return False

        self.saveState()
        self.totalCancelations += 1
        self.avl.cancelationNode(nodeToCancel, rebalance=not self.stressMode)
        self.penaltyService.applyPenalty()
        return True

    """
    save the state into a Stack
    """

    def saveState(self):
        self.history.push(deepcopy(self.avl))

    """
    allows to undo actions 
    """

    def undoAction(self):
        if not self.history:
            return False

        self.avl = self.history.pop()
        return True

    def nodeToJson(self, node):
        if node is None:
            return None

        flight = node.getValue()
        height = node.getHeight()
        balance = self.avl.balance_factor(node)
        finalPrice = flight.calculateFinalPrice(node.isCritical())

        return {
            "codigo": flight.getIdFlight(),
            "origen": flight.getDepartureCity(),
            "destino": flight.getArrivalCity(),
            "horaSalida": flight.getDepartureDate(),
            "precioBase": flight.getPrice(),
            "precioFinal": finalPrice,
            "pasajeros": flight.getNumberPassengers(),
            "prioridad": flight.getPriority(),
            "promocion": flight.getPromotion(),
            "alerta": flight.getAlert(),
            "esCritico": node.isCritical(),
            "altura": height,
            "factorEquilibrio": balance,
            "izquierdo": self.nodeToJson(node.getLeftChild()),
            "derecho": self.nodeToJson(node.getRightChild()),
        }

    def getAvlTreeJson(self):
        return self.nodeToJson(self.avl.root)

    def getBstTreeJson(self):
        return self.nodeToJson(self.bst.root)

    # does the same that getTreeJson method..??
    def exportTree(self):
        return self.nodeToJson(self.avl.root)

    # this part is to save a version (version button with the name version).
    def saveVersion(self, name):
        if not self.avl.root:
            raise Exception("No tree loaded")
        self.versionService.saveVersion(name, self.avl)

    def loadVersion(self, name):
        version = self.versionService.loadVersion(name)

        if version is None:
            return False

        self.saveState()
        self.avl = version
        return True

    def getVersions(self):
        return self.versionService.getAllVersions()

    # this part is for the simulation of concurrence
    def enqueueFlight(self, flight):
        self.queueService.enqueueFlight(flight)

    def processQueue(self):
        return self.queueService.processQueue(self)

    def getMetrics(self):
        return self.metricsService.getMetrics(self)

    # its not necessary to call the method in the stressMode conditional because in the user interface we can´t
    # touch the button verify avl properties. Only with stress mode active.
    def getAuditAVL(self):
        return self.auditoryService.auditAVL()

    def deleteLowestProfitFlight(self):
        return self.profitService.deleteLowestProfitFlight()
