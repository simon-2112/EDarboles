class PenaltyService:
    """
    only able to stress mode service,
    determine the limit, and apply price restrictions.
    """
    def __init__(self, treeService):
        self.treeService = treeService
        self.depthLimit = 0

    def setDepthLimit(self, limit):
        self.depthLimit = limit
        if not self.treeService.stressMode:
            raise Exception("Auditory only useful with stress mode")
        self.applyPenalty()

    def applyPenalty(self):
        if not self.treeService.stressMode:
            raise Exception("Auditory only useful with stress mode")
        root = self.treeService.avl.root
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
    
    def clearPenalty(self):
        self._traverseAndClear(self.treeService.avl.root)

    def _traverseAndClear(self, node):
        if node is None:
            return
        
        node.setCritical(False)

        self._traverseAndClear(node.getLeftChild())
        self._traverseAndClear(node.getRightChild())