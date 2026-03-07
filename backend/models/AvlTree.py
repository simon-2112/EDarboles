class AvlTree:
    """AVL tree implementation for balancing nodes after insertions/deletions.

    This class uses the same Node model as the BST (with getValue, getLeftChild,
    getRightChild, setLeftChild, setRightChild, setParent). It maintains the AVL
    property (balance factor -1..1) by applying rotations.
    """

    def __init__(self):
        self.root = None

    def getRoot(self):
        return self.root

    # ------------------------------ INSERTION ------------------------------

    def insert(self, node):
        """Insert a node and rebalance the tree."""
        if self.root is None:
            self.root = node
            return

        self.root = self._insert(self.root, node)

    def _insert(self, current, node):
        if node.getValue() == current.getValue():
            # Duplicate keys are not inserted.
            return current

        if node.getValue() < current.getValue():
            if current.getLeftChild() is None:
                current.setLeftChild(node)
                node.setParent(current)
            else:
                child_root = self._insert(current.getLeftChild(), node)
                current.setLeftChild(child_root)
                child_root.setParent(current)
        else:
            if current.getRightChild() is None:
                current.setRightChild(node)
                node.setParent(current)
            else:
                child_root = self._insert(current.getRightChild(), node)
                current.setRightChild(child_root)
                child_root.setParent(current)

        return self._rebalance(current)

    # ------------------------------ DELETION ------------------------------

    def delete(self, value):
        """Delete a node by value and rebalance the tree."""
        self.root = self._delete(self.root, value)
        if self.root is not None:
            self.root.setParent(None)

    def _delete(self, current, value):
        if current is None:
            return None

        if value < current.getValue():
            current.setLeftChild(self._delete(current.getLeftChild(), value))
            if current.getLeftChild() is not None:
                current.getLeftChild().setParent(current)
        elif value > current.getValue():
            current.setRightChild(self._delete(current.getRightChild(), value))
            if current.getRightChild() is not None:
                current.getRightChild().setParent(current)
        else:
            # Node to delete found
            if current.getLeftChild() is None:
                return current.getRightChild()
            if current.getRightChild() is None:
                return current.getLeftChild()

            # Node has two children: replace with predecessor
            pred = self._max_node(current.getLeftChild())
            current.setValue(pred.getValue())
            current.setLeftChild(self._delete(current.getLeftChild(), pred.getValue()))
            if current.getLeftChild() is not None:
                current.getLeftChild().setParent(current)

        return self._rebalance(current)

    def _max_node(self, node):
        while node.getRightChild() is not None:
            node = node.getRightChild()
        return node

    # ----------------------------- BALANCING -------------------------------

    def _height(self, node):
        if node is None:
            return 0
        return 1 + max(self._height(node.getLeftChild()), self._height(node.getRightChild()))

    def _balance_factor(self, node):
        if node is None:
            return 0
        return self._height(node.getLeftChild()) - self._height(node.getRightChild())

    def _rebalance(self, node):
        bf = self._balance_factor(node)
        if bf > 1:
            # Left heavy
            if self._balance_factor(node.getLeftChild()) < 0:
                node.setLeftChild(self._rotate_left(node.getLeftChild()))
                node.getLeftChild().setParent(node)
            return self._rotate_right(node)

        if bf < -1:
            # Right heavy
            if self._balance_factor(node.getRightChild()) > 0:
                node.setRightChild(self._rotate_right(node.getRightChild()))
                node.getRightChild().setParent(node)
            return self._rotate_left(node)

        return node

    def _rotate_left(self, z):
        y = z.getRightChild()
        if y is None:
            return z

        t2 = y.getLeftChild()
        y.setLeftChild(z)
        z.setRightChild(t2)

        if t2 is not None:
            t2.setParent(z)

        parent = z.getParent()
        y.setParent(parent)
        z.setParent(y)

        if parent is not None:
            if parent.getLeftChild() is z:
                parent.setLeftChild(y)
            else:
                parent.setRightChild(y)

        return y

    def _rotate_right(self, z):
        y = z.getLeftChild()
        if y is None:
            return z

        t3 = y.getRightChild()
        y.setRightChild(z)
        z.setLeftChild(t3)

        if t3 is not None:
            t3.setParent(z)

        parent = z.getParent()
        y.setParent(parent)
        z.setParent(y)

        if parent is not None:
            if parent.getLeftChild() is z:
                parent.setLeftChild(y)
            else:
                parent.setRightChild(y)

        return y

    # --------------------------- VALIDACIÓN AVL ---------------------------

    def validate_avl(self):
        """Return True if the tree satisfies AVL balance properties."""
        def _check(node):
            if node is None:
                return True, 0
            left_ok, left_h = _check(node.getLeftChild())
            right_ok, right_h = _check(node.getRightChild())
            ok = left_ok and right_ok and abs(left_h - right_h) <= 1
            return ok, 1 + max(left_h, right_h)

        ok, _ = _check(self.root)
        return ok

    # --------------------------- RECORRIDOS -------------------------------

    def search(self, value):
        if self.root is None:
            return None
        return self.__search(self.root, value)

    def __search(self, currentRoot, value):
        if currentRoot is None:
            return None
        if currentRoot.getValue() == value:
            return currentRoot
        if value < currentRoot.getValue():
            return self.__search(currentRoot.getLeftChild(), value)
        return self.__search(currentRoot.getRightChild(), value)

    def breadthFirstSearch(self):
        if self.root is None:
            return []
        queue = [self.root]
        result = []
        while queue:
            node = queue.pop(0)
            result.append(node.getValue())
            if node.getLeftChild() is not None:
                queue.append(node.getLeftChild())
            if node.getRightChild() is not None:
                queue.append(node.getRightChild())
        return result

    def preOrderTraversal(self):
        result = []
        self.__preOrderTraversal(self.root, result)
        return result

    def __preOrderTraversal(self, currentRoot, result):
        if currentRoot is None:
            return
        result.append(currentRoot)
        self.__preOrderTraversal(currentRoot.getLeftChild(), result)
        self.__preOrderTraversal(currentRoot.getRightChild(), result)

    def inOrderTraversal(self):
        result = []
        self.__inOrderTraversal(self.root, result)
        return result

    def __inOrderTraversal(self, currentRoot, result):
        if currentRoot is None:
            return
        self.__inOrderTraversal(currentRoot.getLeftChild(), result)
        result.append(currentRoot)
        self.__inOrderTraversal(currentRoot.getRightChild(), result)

    def posOrderTraversal(self):
        result = []
        self.__posOrderTraversal(self.root, result)
        return result

    def __posOrderTraversal(self, currentRoot, result):
        if currentRoot is None:
            return
        self.__posOrderTraversal(currentRoot.getLeftChild(), result)
        self.__posOrderTraversal(currentRoot.getRightChild(), result)
        result.append(currentRoot)

    # --------------------------- IMPRESIÓN ------------------------------

    def print_tree(self):
        if self.root is None:
            print("El árbol está vacío.")
        else:
            self.__print_tree(self.root, "", True)

    def __print_tree(self, node=None, prefix="", is_left=True):
        if node is not None:
            if node.getRightChild():
                new_prefix = prefix + ("│   " if is_left else "    ")
                self.__print_tree(node.getRightChild(), new_prefix, False)
            connector = "└── " if is_left else "┌── "
            print(prefix + connector + str(node.getValue()))
            if node.getLeftChild():
                new_prefix = prefix + ("    " if is_left else "│   ")
                self.__print_tree(node.getLeftChild(), new_prefix, True)
