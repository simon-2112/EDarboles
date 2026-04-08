class AuditoryService:
    def __init__(self, treeService):
        self.treeService = treeService

    def auditAVL(self):
        """
        Audit the entire AVL tree and return a detailed report.
        Only enabled in stressMode.
        """
        if not self.treeService.stressMode:
            raise Exception("Auditory only useful with stress mode")

        report, inconsistentNodes = self._auditNode(self.treeService.avl.root)
        return {"treeReport": report, "inconsistentNodes": inconsistentNodes}

    def _auditNode(self, node):
        """
        Returns a dictionary with node information and a list of inconsistent nodes
        """
        if node is None:
            return None, []

        leftReport, leftInconsistent = self._auditNode(node.getLeftChild())
        rightReport, rightInconsistent = self._auditNode(node.getRightChild())

        left_height = leftReport["altura"] if leftReport else 0
        right_height = rightReport["altura"] if rightReport else 0

        balance = left_height - right_height
        height = 1 + max(left_height, right_height)

        isConsistent = abs(balance) <= 1

        flight = node.getValue()

        nodeReport = {
            "codigo": flight.getIdFlight(),
            "altura": height,
            "factorEquilibrio": balance,
            "esConsistente": isConsistent,
            "izquierdo": leftReport,
            "derecho": rightReport,
        }

        # List of inconsistencies
        inconsistentNodes = leftInconsistent + rightInconsistent
        if not isConsistent:
            inconsistentNodes.append(flight.getIdFlight())

        return nodeReport, inconsistentNodes
