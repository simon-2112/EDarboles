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

        flights = avl.inOrderTraversal()

        avl.clear()
        avl.resetRotationStats()
        
        avl.root = avl.buildBalancedTree(flights)

        for flight in flights:
            node  = Node(flight)
            avl.insert(node, True)

        return {
            "message": "Rebalanceo global aplicado",
            "nodes": len(flights),
            "rotations": avl.getRotationStats() if hasattr(avl, "getRotationStats") else {}
        }