class PenaltyService:
    """
    only able to stress mode service,
    determine the limit, and apply price restrictions.
    """
    def __init__(self, treeService):
        self.treeService = treeService
        self.depthLimit = None

    def setDepthLimit(self, limit):
        self.depthLimit = limit
        self.applyPenalty()

    def applyPenalty(self):
        root = self.treeService.avl.root
        if self.depthLimit is None:
            return 
        self._traverseAndApply(root, 0)

    def _traverseAndApply(self, node, depth):
        if node is None:
            return

        # regla clave
        if depth > self.depthLimit:
            node.setCritical(True)
        else:
            node.setCritical(False)

        self._traverseAndApply(node.getLeftChild(), depth + 1)
        self._traverseAndApply(node.getRightChild(), depth + 1)