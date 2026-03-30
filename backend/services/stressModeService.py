from models.Node import Node
class StressService:

    def __init__(self, treeService):
        self.treeService = treeService

    def activateStress(self):
        self.treeService.stressMode = True

    def desactivateStress(self):
        self.treeService.stressMode = False
        return self.rebalanceGlobal()

    """
    this method involves the case in witch stressMode is True, so it allows deformations in the tree
    then when we pass to rebalanceGlobal mode (normal mode), this desbalanced tree is transformed to a balanced tree.
    """
    def rebalanceGlobal(self):
        avl = self.treeService.avl
        
        avl.resetRotationStats()
        changed = True
        while changed:
            avl.root, changed = avl.rebalanceFull(avl.root)
        
        if avl.root is not None:
            avl.root.setParent(None)
        
        self.treeService.penaltyService.applyPenalty()

        return {
            "message": "Rebalanceo global aplicado",
            "nodes": avl.rootWeight(),
            "rotations": avl.getRotationStats()
        }