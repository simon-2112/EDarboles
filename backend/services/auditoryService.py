class AuditoryService:
    def __init__(self, treeService):
        self.treeService = treeService

    def auditAVL(self):
        """
        Audita todo el árbol AVL y devuelve un reporte detallado.
        Solo habilitado en stressMode.
        """
        if not self.treeService.stressMode:
            raise Exception("Auditory only useful with stress mode")

        report, inconsistentNodes = self._auditNode(self.treeService.avl.root)
        return {
            "treeReport": report,
            "inconsistentNodes": inconsistentNodes
        }

    def _auditNode(self, node):
        """
        Retorna un dict con información del nodo y una lista de nodos inconsistentes
        """
        if node is None:
            return None, []
        
        avl = self.treeService.avl

        leftReport, leftInconsistent = self._auditNode(node.getLeftChild())
        rightReport, rightInconsistent = self._auditNode(node.getRightChild())

        # Alturas de subárboles
        # left_height = leftReport["altura"] if leftReport else 0
        # right_height = rightReport["altura"] if rightReport else 0

        # Factor de balance
        balance = avl.balance_factor(node)
        # balance = left_height - right_height

        # Altura real
        height = avl.getHeight(node)
        # height = 1 + max(left_height, right_height)

        # Nodo consistente si |factor| <= 1
        isConsistent = abs(balance) <= 1

        # Crear reporte de este nodo
        flight = node.getValue()
        nodeReport = {
            "codigo": flight.getIdFlight(),
            "altura": height,
            "factorEquilibrio": balance,
            "esConsistente": isConsistent,
            "izquierdo": leftReport,
            "derecho": rightReport
        }

        # Lista de inconsistentes
        inconsistentNodes = leftInconsistent + rightInconsistent
        if not isConsistent:
            inconsistentNodes.append(flight.getIdFlight())

        return nodeReport, inconsistentNodes