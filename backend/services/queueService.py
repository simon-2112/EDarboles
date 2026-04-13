from models.Queue import Queue
from models.Node import Node


class QueueService:

    def __init__(self):
        self.queue = Queue()

    def enqueueFlight(self, flight):
        self.queue.enqueue(flight)

    def isEmpty(self):
        return self.queue.isEmpty()

    def processQueue(self, treeService):
        """
        Process the queue and return the steps (avl snapshots)
        while the queue not empty ... process
        """
        steps = []

        while not self.queue.isEmpty():
            flight = self.queue.dequeue()

            node = Node(flight)

            treeService.saveState()

            rebalance = (
                not treeService.stressMode
                if hasattr(treeService, "stressMode")
                else True
            )
            treeService.avl.insert(node, rebalance=rebalance)

            bf = treeService.avl.balance_factor(treeService.avl.root)
            # take this for the stress mode case
            conflict = abs(bf) > 1

            steps.append(
                {
                    "inserted": flight.getIdFlight(),
                    "conflict": conflict,
                    "tree": treeService.getAvlTreeJson(),
                }
            )

        return steps
