# from services.flightTreeService import TreeService
class MetricsService:

    def __init__(self):
        pass
        # self.treeService = TreeService()

    def getMetrics(self, treeService):
        avl = treeService.avl

        return {
            "altura": avl.getHeight(avl.root),
            "rotaciones": avl.rotations,
            "cancelacionesMasivas": treeService.totalCancelations,
            "recorridos": {
                "inorder": avl.inOrderTraversal(),
                "preorder": avl.preOrderTraversal(),
                "postorder": avl.posOrderTraversal(),
                "bfs": avl.breadthFirstSearch()
            },
            "hojas": avl.countLeaves(avl.root)
        }