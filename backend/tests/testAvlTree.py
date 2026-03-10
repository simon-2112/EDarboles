import unittest
from models.AvlTree import AvlTree
from models.Node import Node


class TestAVLTree(unittest.TestCase):

    def setUp(self):
        """Se ejecuta antes de cada test"""
        self.tree = AvlTree()
        self.values = [10, 20, 30, 40, 50, 25]

        for v in self.values:
            self.tree.insert(Node(v))

    # ---------------- INSERT ----------------

    def test_insert_balance(self):
        self.assertTrue(self.tree.validate_avl())

    def test_root_exists(self):
        self.assertIsNotNone(self.tree.getRoot())

    # ---------------- SEARCH ----------------

    def test_search_existing(self):
        node = self.tree.search(30)
        self.assertIsNotNone(node)
        self.assertEqual(node.getValue(), 30)

    def test_search_non_existing(self):
        node = self.tree.search(999)
        self.assertIsNone(node)

    # ---------------- TRAVERSALS ----------------

    def test_inorder_sorted(self):
        result = [node.getValue() for node in self.tree.inOrderTraversal()]
        self.assertEqual(result, sorted(self.values))

    def test_preorder(self):
        result = [node.getValue() for node in self.tree.preOrderTraversal()]
        self.assertTrue(len(result) == len(self.values))

    def test_postorder(self):
        result = [node.getValue() for node in self.tree.posOrderTraversal()]
        self.assertTrue(len(result) == len(self.values))

    def test_bfs(self):
        result = self.tree.breadthFirstSearch()
        self.assertTrue(len(result) == len(self.values))

    # ---------------- DELETE ----------------

    def test_delete_leaf(self):
        self.tree.delete(25)
        self.assertIsNone(self.tree.search(25))
        self.assertTrue(self.tree.validate_avl())

    def test_delete_internal_node(self):
        self.tree.delete(40)
        self.assertIsNone(self.tree.search(40))
        self.assertTrue(self.tree.validate_avl())

    def test_delete_root(self):
        root_value = self.tree.getRoot().getValue()
        self.tree.delete(root_value)
        self.assertTrue(self.tree.validate_avl())

    # ---------------- MASS INSERT ----------------

    def test_many_insertions(self):
        big_tree = AvlTree()

        for i in range(100):
            big_tree.insert(Node(i))

        self.assertTrue(big_tree.validate_avl())


if __name__ == "__main__":
    unittest.main()