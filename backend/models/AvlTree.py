import Queue


class AvlTree:
    """
    AVL tree implementation for maintaining a self-balancing binary search tree.

    An AVL tree is a binary search tree that automatically maintains the balance property
    after insertions and deletions. This means that for every node, the height difference
    between its left and right subtrees is at most 1 (balance factor between -1 and 1).

    This class uses the Node model with methods: getValue(), getLeftChild(), getRightChild(),
    setLeftChild(), setRightChild(), setParent(), getHeight(), and setHeight().

    The tree automatically performs rotations (left, right, left-right, right-left) to
    maintain balance, ensuring O(log n) time complexity for search, insert, and delete operations.
    """

    def __init__(self):
        """
        Initialize an empty AVL tree.

        Creates a new AVL tree with no root node. The tree is ready to accept insertions.
        """
        self.root = None

    def getRoot(self):
        """
        Get the root node of the tree.

        Returns:
            Node: The root node of the tree, or None if the tree is empty.
        """
        return self.root


    # ========================= INSERTION OPERATIONS =========================

    def insert(self, node):
        """
        Insert a new node into the AVL tree and rebalance if necessary.

        This method adds a new node to the tree while maintaining the AVL balance property.
        If a node with the same value already exists, it will not be inserted (duplicates
        are rejected). After insertion, the tree is automatically rebalanced using rotations.

        Args:
            node (Node): The node to insert. The node's value is used to determine its position.

        Time Complexity: O(log n) - Insert and rotation operations take logarithmic time.
        """
        if self.root is None:
            # Tree is empty, set this node as root
            self.root = node
            return

        # Recursively insert the node starting from the root
        self.root = self._insert(self.root, node)

    def _insert(self, current, node):
        """
        Recursively insert a node into the tree starting from a given node.

        This private method handles the recursive insertion logic. It compares node values
        to determine left or right placement and calls itself recursively on the appropriate
        child. After insertion, it rebalances the subtree.

        Args:
            current (Node): The current node in the recursion (subtree root).
            node (Node): The node to insert.

        Returns:
            Node: The root of the rebalanced subtree after insertion.
        """
        if node.getValue() == current.getValue():
            # Duplicate keys are not inserted - maintain unique values in the tree
            return current

        if node.getValue() < current.getValue():
            # Value is smaller, insert to the left subtree
            if current.getLeftChild() is None:
                # Left slot is empty, place the node here
                current.setLeftChild(node)
                node.setParent(current)
            else:
                # Recursively insert into the left subtree
                child_root = self._insert(current.getLeftChild(), node)
                current.setLeftChild(child_root)
                child_root.setParent(current)
        elif current.getRightChild() is None:
            # Value is larger and right slot is empty, place the node here
            current.setRightChild(node)
            node.setParent(current)
        else:
            # Recursively insert into the right subtree
            child_root = self._insert(current.getRightChild(), node)
            current.setRightChild(child_root)
            child_root.setParent(current)

        # Rebalance the current subtree after insertion
        return self._rebalance(current)


    # ========================= DELETION OPERATIONS ==========================

    def delete(self, value):
        """
        Delete a node with the given value from the AVL tree and rebalance.

        This method removes a node from the tree that matches the provided value.
        If the value does not exist, no action is taken. The tree is automatically
        rebalanced after deletion to maintain the AVL property.

        Args:
            value: The value of the node to delete.

        Time Complexity: O(log n) - Search, deletion, and rotation operations take logarithmic time.
        """
        self.root = self._delete(self.root, value)
        # Ensure root parent pointer is None (in case root changed during deletion)
        if self.root is not None:
            self.root.setParent(None)

    def _delete(self, current, value):
        """
        Recursively delete a node with the given value from the subtree.

        This private method searches for the node to delete and handles three cases:
        1. The value is in the left subtree - recurse left
        2. The value is in the right subtree - recurse right
        3. The value matches the current node - handle deletion

        Args:
            current (Node): The current node in the recursion (subtree root).
            value: The value to search for and delete.

        Returns:
            Node: The root of the rebalanced subtree after deletion.
        """
        if current is None:
            # Value not found in tree
            return None

        if value < current.getValue():
            # Search for value in the left subtree
            new_left = self._delete(current.getLeftChild(), value)
            current.setLeftChild(new_left)
            if new_left is not None:
                new_left.setParent(current)

        elif value > current.getValue():
            # Search for value in the right subtree
            new_right = self._delete(current.getRightChild(), value)
            current.setRightChild(new_right)
            if new_right is not None:
                new_right.setParent(current)

        else:
            # Found the node to delete
            return self._delete_node(current)

        # Rebalance the current subtree after deletion
        return self._rebalance(current)

    def _delete_node(self, node):
        """
        Handle the actual deletion of a node, considering three cases.

        This method handles deletion based on the number of children the node has:
        - No children: return None
        - One child (right only): return the right child
        - One child (left only): return the left child
        - Two children: find predecessor, replace node value, and delete the predecessor

        Args:
            node (Node): The node to delete.

        Returns:
            Node: The node that replaces the deleted node, maintaining the BST property.
        """
        if node.getLeftChild() is None:
            # Node has no left child (0 or 1 child on the right)
            return self._replace_with_right_child(node)

        if node.getRightChild() is None:
            # Node has only a left child
            return self._replace_with_left_child(node)

        # Node has two children - use in-order predecessor approach
        return self._delete_with_two_children(node)

    def _replace_with_right_child(self, node):
        """
        Replace a node with its right child.

        This helper method is used when deleting a node that has no left child.
        The node is replaced by its right child (which may be None).

        Args:
            node (Node): The node to replace.

        Returns:
            Node: The right child of the deleted node, or None if it doesn't exist.
        """
        child = node.getRightChild()

        if child is not None:
            # Update the child's parent pointer
            child.setParent(node.getParent())

        return child

    def _replace_with_left_child(self, node):
        """
        Replace a node with its left child.

        This helper method is used when deleting a node that has no right child.
        The node is replaced by its left child (which may be None).

        Args:
            node (Node): The node to replace.

        Returns:
            Node: The left child of the deleted node, or None if it doesn't exist.
        """
        child = node.getLeftChild()

        if child is not None:
            # Update the child's parent pointer
            child.setParent(node.getParent())

        return child

    def _delete_with_two_children(self, node):
        """
        Delete a node that has both left and right children.

        When a node has two children, we use the in-order predecessor strategy:
        1. Find the maximum value in the left subtree (predecessor)
        2. Replace the node's value with the predecessor's value
        3. Recursively delete the predecessor node from the left subtree

        This maintains the BST property: all left descendants < node < all right descendants.

        Args:
            node (Node): The node with two children to delete.

        Returns:
            Node: The node after handling the two-children deletion case.
        """
        # Find the in-order predecessor (maximum value in left subtree)
        pred = self._max_node(node.getLeftChild())
        # Replace node's value with predecessor's value
        node.setValue(pred.getValue())

        # Recursively delete the predecessor from the left subtree
        new_left = self._delete(node.getLeftChild(), pred.getValue())

        node.setLeftChild(new_left)

        if new_left is not None:
            new_left.setParent(node)

        return node

    def _max_node(self, node):
        """
        Find the node with the maximum value in a given subtree.

        This method traverses to the rightmost node in the subtree, which contains
        the maximum value. Used to find the in-order predecessor during deletion
        of nodes with two children.

        Args:
            node (Node): The root of the subtree to search.

        Returns:
            Node: The node with the maximum value in the subtree.
        """
        # Keep moving right until we find a node with no right child
        while node.getRightChild() is not None:
            node = node.getRightChild()
        return node


    # ========================= BALANCING OPERATIONS ==========================

    def rootWeight(self):
        """Calculate the total number of nodes in the tree.
        This treats the current root as the top of the subtree to measure.

        Returns:
            int: The number of nodes in the tree, or 0 if the tree is empty.
        """
        return self.nodeWeight(self.root)

    def nodeWeight(self, node):
        """
        Calculate the total number of nodes in a subtree rooted at the given node.
        This treats the provided node as the top of the subtree to measure.

        Args:
            node (Node): The root node of the subtree to measure, or None for an empty subtree.

        Returns:
            int: The number of nodes in the subtree, or 0 if the node is None.
        """
        if node is None:
            return 0

        return 1 + self.nodeWeight(node.getLeftChild()) + self.nodeWeight(node.getRightChild())

    def _height(self, node):
        """
        Get the height of a node in the tree.

        The height of a node is defined as the number of edges on the longest path
        from the node to a leaf. A None node has height 0, and a leaf node has height 0.

        Args:
            node (Node): The node whose height to retrieve.

        Returns:
            int: The height of the node, or 0 if the node is None.
        """
        # None nodes have height 0, otherwise get the node's stored height
        return 0 if node is None else node.getHeight()

    def _update_height(self, node):
        """
        Update the height of a node based on its children's heights.

        The height of a node is calculated as 1 + the maximum of its children's heights.
        This should be called after any modification that affects the tree structure
        (insertion, deletion, rotation).

        Args:
            node (Node): The node whose height to update.
        """
        # Height is 1 plus the maximum height of the two children
        node.setHeight(
            1 + max(
                self._height(node.getLeftChild()),
                self._height(node.getRightChild())
            )
        )

    def _balance_factor(self, node):
        """
        Calculate the balance factor of a node.

        The balance factor is defined as the difference between the heights of the
        left and right subtrees: height(left) - height(right).
        In a balanced AVL tree, this value must be between -1 and 1.

        Args:
            node (Node): The node whose balance factor to calculate.

        Returns:
            int: The balance factor of the node. Positive means left-heavy, negative means right-heavy.
        """
        if node is None:
            return 0
        # Balance factor = left height - right height
        return self._height(node.getLeftChild()) - self._height(node.getRightChild())

    def _rebalance(self, node):
        """
        Rebalance a subtree to restore AVL balance properties. This ensures the node's height
        and structure remain valid after insertions or deletions.

        Args:
            node (Node): The root of the subtree to rebalance.

        Returns:
            Node: The new root of the subtree after any necessary rotations.
        """

        self._update_height(node)

        bf = self._balance_factor(node)

        # LEFT HEAVY
        if bf > 1:

            # LEFT-RIGHT CASE
            if self._balance_factor(node.getLeftChild()) < 0:
                return self._rotate_left_right(node)

            # LEFT-LEFT CASE
            return self._rotate_right(node)

        # RIGHT HEAVY
        if bf < -1:

            # RIGHT-LEFT CASE
            if self._balance_factor(node.getRightChild()) > 0:
                return self._rotate_right_left(node)

            # RIGHT-RIGHT CASE
            return self._rotate_left(node)

        return node

    def _rotate_left(self, pivot):
        """
        Perform a left rotation around the pivot node.

        A left rotation moves the right child up and the pivot node down:
                pivot                    new_root
               /    \\                  /        \\
              A    new_root    =>   pivot        C
                  /    \\          /    \\
                 B      C        A      B

        Args:
            pivot (Node): The node around which to rotate.

        Returns:
            Node: The new root of the rotated subtree.
        """
        # Get the right child which will become the new root
        new_root = pivot.getRightChild()
        if new_root is None:
            return pivot

        # Save the left subtree of new_root (will become right subtree of pivot)
        middle_subtree = new_root.getLeftChild()

        # Perform the rotation: move new_root up and pivot down
        new_root.setLeftChild(pivot)
        pivot.setRightChild(middle_subtree)

        # Update parent pointers for all affected nodes
        root = self._update_rotation_parents(middle_subtree, pivot, new_root)

        # Update heights of affected nodes (bottom-up)
        self._update_height(pivot)
        self._update_height(new_root)

        return root

    def _rotate_right(self, pivot):
        """
        Perform a right rotation around the pivot node.

        A right rotation moves the left child up and the pivot node down:
                pivot                  new_root
               /    \\                /        \\
            new_root  C      =>     A        pivot
            /    \\                          /    \\
           A      B                        B      C

        Args:
            pivot (Node): The node around which to rotate.

        Returns:
            Node: The new root of the rotated subtree.
        """
        # Get the left child which will become the new root
        new_root = pivot.getLeftChild()
        if new_root is None:
            return pivot

        # Save the right subtree of new_root (will become left subtree of pivot)
        middle_subtree = new_root.getRightChild()

        # Perform the rotation: move new_root up and pivot down
        new_root.setRightChild(pivot)
        pivot.setLeftChild(middle_subtree)

        # Update parent pointers for all affected nodes
        root = self._update_rotation_parents(middle_subtree, pivot, new_root)

        # Update heights of affected nodes (bottom-up)
        self._update_height(pivot)
        self._update_height(new_root)

        return root
    

    def _rotate_left_right(self, node):
        """
        Perform a left-right double rotation on the given node.

        This operation first rotates the left child to the left, then rotates
        the node itself to the right to restore AVL balance in a left-right case.

        Args:
            node (Node): The root of the subtree where the left-right imbalance occurs.

        Returns:
            Node: The new root of the subtree after the double rotation.
        """
        node.setLeftChild(
            self._rotate_left(node.getLeftChild())
        )

        return self._rotate_right(node)
    

    def _rotate_right_left(self, node):
        """
        Perform a right-left double rotation on the given node.

        This operation first rotates the right child to the right, then rotates
        the node itself to the left to restore AVL balance in a right-left case.

        Args:
            node (Node): The root of the subtree where the right-left imbalance occurs.

        Returns:
            Node: The new root of the subtree after the double rotation.
        """
        node.setRightChild(
            self._rotate_right(node.getRightChild())
        )
        return self._rotate_left(node)

    def _update_rotation_parents(self, middle_subtree, old_root, new_root):
        """
        Update parent pointers after a rotation operation.

        This helper method ensures that all parent-child relationships are correctly
        maintained after a rotation. It also updates the tree's root if the rotation
        occurred at the top level.

        Args:
            middle_subtree (Node): The subtree that moved between nodes during rotation.
            old_root (Node): The pivot node that moved down.
            new_root (Node): The node that moved up to become the new root of this subtree.

        Returns:
            Node: The new root of the rotated subtree.
        """
        # Update parent of middle subtree if it exists
        if middle_subtree is not None:
            middle_subtree.setParent(old_root)

        # Get the parent of the old root
        parent = old_root.getParent()

        # Update new_root's parent to be the old parent
        new_root.setParent(parent)
        # Update old_root's parent to be the new_root
        old_root.setParent(new_root)

        if parent is None:
            # The rotation happened at the tree root level
            self.root = new_root
        elif parent.getLeftChild() is old_root:
            # old_root was the left child of its parent
            parent.setLeftChild(new_root)
        else:
            # old_root was the right child of its parent
            parent.setRightChild(new_root)

        return new_root


    # ======================== AVL VALIDATION ================================

    def validate_avl(self):
        """
        Validate if the entire tree satisfies AVL balance properties.

        This method checks two important properties:
        1. Binary Search Tree property: left descendants < node < right descendants
        2. AVL balance property: for each node, |height(left) - height(right)| <= 1

        This is useful for testing and debugging to ensure the tree maintains its invariants
        after insertions and deletions.

        Returns:
            bool: True if the tree satisfies all AVL properties, False otherwise.
        """
        def _check(node):
            """
            Recursively check both BST and AVL properties for a subtree.

            Returns a tuple of (is_valid, actual_height) where:
            - is_valid: True if the subtree satisfies all AVL properties
            - actual_height: The actual height of the subtree
            """
            if node is None:
                return True, 0

            # Check left and right subtrees
            left_ok, left_h = _check(node.getLeftChild())
            right_ok, right_h = _check(node.getRightChild())

            # Ensure both subtrees are valid and balance factor is within range
            ok = left_ok and right_ok and abs(left_h - right_h) <= 1

            # Calculate and return the height of this node
            return ok, 1 + max(left_h, right_h)

        # Check the entire tree starting from root
        ok, _ = _check(self.root)
        return ok


    # ======================== SEARCH OPERATIONS =============================

    def search(self, value):
        """
        Search for a node with a given value in the tree.

        This method performs a binary search starting from the root. It returns the
        node if found, or None if the value does not exist in the tree.

        Args:
            value: The value to search for.

        Returns:
            Node: The node with the matching value, or None if not found.

        Time Complexity: O(log n) - Binary search traversal in a balanced tree.
        """
        # Return None if tree is empty, otherwise start search from root
        return None if self.root is None else self.__search(self.root, value)

    def __search(self, currentRoot, value):
        """
        Recursively search for a node with a given value in a subtree.

        This private method performs binary search by comparing the target value with
        the current node's value and recursing left or right accordingly.

        Args:
            currentRoot (Node): The current node in the search (subtree root).
            value: The value to search for.

        Returns:
            Node: The node with the matching value, or None if not found in this subtree.
        """
        if currentRoot is None:
            # Reached a leaf without finding the value
            return None
        if currentRoot.getValue() == value:
            # Found the target value
            return currentRoot
        if value < currentRoot.getValue():
            # Search in the left subtree
            return self.__search(currentRoot.getLeftChild(), value)
        # Search in the right subtree
        return self.__search(currentRoot.getRightChild(), value)


    # ======================== TREE TRAVERSALS ================================

    def breadthFirstSearch(self):
        """
        Perform a breadth-first search (level-order) traversal of the tree.

        This method visits all nodes level by level from top to bottom, left to right.
        It uses a queue data structure to process nodes in order.

        Returns:
            list: A list of node values in breadth-first order. Empty list if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        Space Complexity: O(w) - Where w is the maximum width (number of nodes) at any level.
        """
        if self.root is None:
            return []

        # Initialize queue with root node
        queue = Queue.Queue()
        queue.enqueue(self.root)
        result = []

        # Process nodes level by level
        while not queue.isEmpty():
            node = queue.dequeue()
            result.append(node.getValue())

            # Enqueue left child if it exists
            if node.getLeftChild() is not None:
                queue.enqueue(node.getLeftChild())
            # Enqueue right child if it exists
            if node.getRightChild() is not None:
                queue.enqueue(node.getRightChild())

        return result

    def preOrderTraversal(self):
        """
        Perform a pre-order traversal of the tree.

        Pre-order traversal visits nodes in this order: Node -> Left subtree -> Right subtree.
        This traversal is useful for creating a copy of the tree or evaluating expressions.

        Returns:
            list: A list of nodes in pre-order sequence. Empty list if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        """
        result = []
        self.__preOrderTraversal(self.root, result)
        return result

    def __preOrderTraversal(self, currentRoot, result):
        """
        Recursively perform pre-order traversal on a subtree.

        Visit order: Current node -> Left subtree -> Right subtree

        Args:
            currentRoot (Node): The current node (subtree root) being visited.
            result (list): The list to accumulate nodes in pre-order sequence.
        """
        if currentRoot is None:
            return

        # Process current node first
        result.append(currentRoot)
        # Then traverse left subtree
        self.__preOrderTraversal(currentRoot.getLeftChild(), result)
        # Then traverse right subtree
        self.__preOrderTraversal(currentRoot.getRightChild(), result)

    def inOrderTraversal(self):
        """
        Perform an in-order traversal of the tree.

        In-order traversal visits nodes in this order: Left subtree -> Node -> Right subtree.
        For a BST, this produces nodes in ascending order by value.

        Returns:
            list: A list of nodes in in-order sequence. Empty list if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        """
        result = []
        self.__inOrderTraversal(self.root, result)
        return result

    def __inOrderTraversal(self, currentRoot, result):
        """
        Recursively perform in-order traversal on a subtree.

        Visit order: Left subtree -> Current node -> Right subtree
        This order produces values in ascending sorted order for a BST.

        Args:
            currentRoot (Node): The current node (subtree root) being visited.
            result (list): The list to accumulate nodes in in-order sequence.
        """
        if currentRoot is None:
            return

        # Traverse left subtree first
        self.__inOrderTraversal(currentRoot.getLeftChild(), result)
        # Process current node
        result.append(currentRoot)
        # Then traverse right subtree
        self.__inOrderTraversal(currentRoot.getRightChild(), result)

    def posOrderTraversal(self):
        """
        Perform a post-order traversal of the tree.

        Post-order traversal visits nodes in this order: Left subtree -> Right subtree -> Node.
        This is useful for deleting trees or computing values bottom-up.

        Returns:
            list: A list of nodes in post-order sequence. Empty list if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        """
        result = []
        self.__posOrderTraversal(self.root, result)
        return result

    def __posOrderTraversal(self, currentRoot, result):
        """
        Recursively perform post-order traversal on a subtree.

        Visit order: Left subtree -> Right subtree -> Current node

        Args:
            currentRoot (Node): The current node (subtree root) being visited.
            result (list): The list to accumulate nodes in post-order sequence.
        """
        if currentRoot is None:
            return

        # Traverse left subtree first
        self.__posOrderTraversal(currentRoot.getLeftChild(), result)
        # Then traverse right subtree
        self.__posOrderTraversal(currentRoot.getRightChild(), result)
        # Process current node last
        result.append(currentRoot)


    # ======================== TREE VISUALIZATION =============================

    def print_tree(self):
        """
        Print a visual representation of the tree structure to the console.

        Displays the tree using ASCII art with connecting lines to show the hierarchical
        structure. The root appears at the left, with branches extending to the right.
        Left children appear above right children at each level.

        If the tree is empty, prints a message indicating this.
        """
        if self.root is None:
            print("The tree is empty.")
        else:
            self.__print_tree(self.root, "", True)

    def __print_tree(self, node=None, prefix="", is_left=True):
        """
        Recursively print a tree structure with ASCII art visualization.

        This private method uses Unicode box-drawing characters and indentation to create
        a visual representation of the tree structure. It processes right subtree first
        (displayed above) then the node, then left subtree (displayed below).

        Args:
            node (Node): The current node to print (subtree root).
            prefix (str): The indentation prefix for alignment of child nodes.
            is_left (bool): Whether this node is a left child (affects connector characters).
        """
        if node is not None:
            # Process right subtree first (will be printed above the current node)
            if node.getRightChild():
                # Calculate prefix for right child
                new_prefix = prefix + ("│   " if is_left else "    ")
                self.__print_tree(node.getRightChild(), new_prefix, False)

            # Choose connector character based on whether this is a left or right child
            connector = "└── " if is_left else "┌── "
            print(prefix + connector + str(node.getValue()))

            # Process left subtree (will be printed below the current node)
            if node.getLeftChild():
                # Calculate prefix for left child
                new_prefix = prefix + ("    " if is_left else "│   ")
                self.__print_tree(node.getLeftChild(), new_prefix, True)