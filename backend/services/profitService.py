class ProfitService:
    def __init__(self, treeService):
        self.treeService = treeService
        self.candidates = []

    def deleteLowestProfitFlight(self):
        """
        Search the lowest and cancel his branch.
        
        return: lowest profit node
        """
        avl = self.treeService.avl
        if avl.root is None:
            return None
        
        candidate = {"node": None , "rent": float("inf"), "depth": -1}

        self._findLowestProfitNode(avl.root, 0, candidate)

        if candidate["node"] is None:
            return None
        #cancel the node
        self.treeService.descendantsCancelation(candidate["node"].getValue().getIdFlight())
        return candidate["node"].getValue().getIdFlight()  # Retorna código del nodo eliminado

    def _findLowestProfitNode(self, node, depth, candidate):
        """
        Método privado que recorre el árbol y actualiza el nodo candidato
        con menor rentabilidad siguiendo las reglas de desempate.
        """
        if node is None:
            return

        flight = node.getValue()
        totalRevenue = flight.calculateTotalRevenue()

        #we fixed the promotion value to 100 if there exist
        promoValue = 100 if flight.getPromotion() else 0


        #profit
        rent = totalRevenue - promoValue

        update = False
        if rent < candidate["rent"]:
            update = True
        elif rent == candidate["rent"]:
            if depth > candidate["depth"]:
                update = True
            elif depth == candidate["depth"]:
                if candidate["node"] is None or flight.getIdFlight() > candidate["node"].getValue().getIdFlight():
                    update = True

        if update:
            candidate["node"] = node
            candidate["rent"] = rent
            candidate["depth"] = depth
        
        self._findLowestProfitNode(node.getLeftChild(), depth + 1, candidate)
        self._findLowestProfitNode(node.getRightChild(), depth + 1, candidate)
