from models.Queue import Queue


class BstTree:
    """
    Binary Search Tree (BST) implementation without automatic balancing.

    A Binary Search Tree is a data structure that maintains sorted data with efficient
    insertion, deletion, and search operations. For every node, all values in the left
    subtree are smaller and all values in the right subtree are larger.

    This implementation maintains the BST property but does not perform self-balancing,
    so in worst-case scenarios (like inserting sorted data), operations can degrade to
    O(n) time complexity. For balanced insertion patterns, it provides O(log n) operations.

    The tree uses a Node model with methods: getValue(), getLeftChild(), getRightChild(),
    setLeftChild(), setRightChild(), and setParent().
    """

    def __init__(self):
        """
        Initialize an empty Binary Search Tree.

        Creates a new BST with no root node. The tree is ready to accept insertions.
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
        Insert a new node into the Binary Search Tree.

        This method adds a new node to the tree while maintaining the BST property.
        If a node with the same value already exists, a message is printed and the node
        is not inserted (duplicates are rejected). If the tree is empty, the node becomes
        the root. Otherwise, the insertion is delegated to the recursive helper method.

        Args:
            node (Node): The node to insert. The node's value is used to determine its position.

        Time Complexity: O(log n) on average for balanced trees, O(n) in worst case (unbalanced trees).
        """
        # Check if tree is empty to assign the node as root
        if self.root is None:
            self.root = node
        else:
            # Tree has a root, proceed with recursive insertion
            self.__insert(self.root, node)

    def __insert(self, currentRoot, node):
        """
        Recursively insert a node into the tree starting from a given node.

        This private method handles the recursive insertion logic. It compares node values
        to determine left or right placement and calls itself recursively on the appropriate
        subtree. Duplicate values are not inserted into the tree.

        Args:
            currentRoot (Node): The current node in the recursion (subtree root).
            node (Node): The node to insert.
        """
        if node.getValue() == currentRoot.getValue():
            # Duplicate values are not inserted - maintain unique values in the tree
            print(f"The value {node.getValue()} already exists in the tree.")
        elif node.getValue() > currentRoot.getValue():
            # Verify if right child exists
            if currentRoot.getRightChild() is None:
                # Right slot is empty, place the node here
                currentRoot.setRightChild(node)
                node.setParent(currentRoot)
            else:
                # Right child exists, recurse to insert further down
                self.__insert(currentRoot.getRightChild(), node)
        elif currentRoot.getLeftChild() is None:
            # Left slot is empty, place the node here
            currentRoot.setLeftChild(node)
            node.setParent(currentRoot)
        else:
            # Left child exists, recurse to insert further down
            self.__insert(currentRoot.getLeftChild(), node)


    # ========================= SEARCH OPERATIONS =============================

    def search(self, value):
        """
        Search for a node with a given value in the tree.

        This method performs a binary search starting from the root. It raises an exception
        if the tree is empty, otherwise returns the node if found, or None if the value
        does not exist in the tree.

        Args:
            value: The value to search for.

        Returns:
            Node: The node with the matching value, or None if not found.

        Raises:
            Exception: If the tree is empty (no root node exists).

        Time Complexity: O(log n) on average, O(n) in worst case (unbalanced trees).
        """
        # Validate that the tree has a root
        if self.root is None:
            raise Exception("The tree has no root.")
        else:
            # Start recursive search from root
            return self.__search(self.root, value)

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
        if currentRoot.getValue() == value:
            # Found the target value
            return currentRoot
        elif value > currentRoot.getValue():
            # Value is larger, search in the right subtree
            if currentRoot.getRightChild() is None:
                # No right child - value not found in this path
                return None
            else:
                # Recurse into the right subtree
                return self.__search(currentRoot.getRightChild(), value)
        elif currentRoot.getLeftChild() is None:
            # No left child - value not found in this path
            return None
        else:
            # Recurse into the left subtree
            return self.__search(currentRoot.getLeftChild(), value)


    # ========================= TREE TRAVERSALS ================================

    def breadthFirstSearch(self):
        """
        Perform a breadth-first search (level-order) traversal of the tree.

        This method visits all nodes level by level from top to bottom, left to right.
        It uses a queue data structure to process nodes in order. Prints a message if
        the tree is empty.

        Returns:
            list: A list of node values in breadth-first order, or None if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        Space Complexity: O(w) - Where w is the maximum width (number of nodes) at any level.
        """
        # Check if the tree is empty
        if self.root is None:
            print("The tree is empty.")
            return None
        else:
            # Initialize queue with root node
            queue = Queue.Queue()
            queue.enqueue(self.root)
            result = []

            # Process nodes level by level
            while not queue.isEmpty():
                # Dequeue current node
                currentNode = queue.dequeue()
                # Add node value to result
                result.append(currentNode.getValue())

                # Enqueue left child if it exists
                if currentNode.getLeftChild() is not None:
                    queue.enqueue(currentNode.getLeftChild())
                # Enqueue right child if it exists
                if currentNode.getRightChild() is not None:
                    queue.enqueue(currentNode.getRightChild())

            return result

    def preOrderTraversal(self):
        """
        Perform a pre-order traversal of the tree.

        Pre-order traversal visits nodes in this order: Node -> Left subtree -> Right subtree.
        This traversal is useful for creating a copy of the tree or evaluating expressions.
        Prints a message if the tree is empty.

        Returns:
            list: A list of nodes in pre-order sequence, or None if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        """
        # Check if the tree is empty
        if self.root is None:
            print("The tree is empty.")
            return None
        else:
            # Create result list for accumulating nodes
            result = []
            # Start recursive pre-order traversal from root
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
        # Process current node first
        result.append(currentRoot)

        # Then traverse left subtree if it exists
        if currentRoot.getLeftChild() is not None:
            self.__preOrderTraversal(currentRoot.getLeftChild(), result)

        # Finally traverse right subtree if it exists
        if currentRoot.getRightChild() is not None:
            self.__preOrderTraversal(currentRoot.getRightChild(), result)

    def inOrderTraversal(self):
        """
        Perform an in-order traversal of the tree.

        In-order traversal visits nodes in this order: Left subtree -> Node -> Right subtree.
        For a BST, this produces nodes in ascending order by value.
        Prints a message if the tree is empty.

        Returns:
            list: A list of nodes in in-order sequence (sorted order), or None if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        """
        # Check if the tree is empty
        if self.root is None:
            print("The tree is empty.")
            return None
        else:
            # Create result list for accumulating nodes
            result = []
            # Start recursive in-order traversal from root
            self.__inOrderTraversal(self.root, result)
            return result

    def __inOrderTraversal(self, currentRoot, result):
        """
        Recursively perform in-order traversal on a subtree.

        Visit order: Left subtree -> Current node -> Right subtree
        For a BST, this produces values in ascending sorted order.

        Args:
            currentRoot (Node): The current node (subtree root) being visited.
            result (list): The list to accumulate nodes in in-order sequence.
        """
        # Traverse left subtree first if it exists
        if currentRoot.getLeftChild() is not None:
            self.__inOrderTraversal(currentRoot.getLeftChild(), result)

        # Process current node
        result.append(currentRoot)

        # Finally traverse right subtree if it exists
        if currentRoot.getRightChild() is not None:
            self.__inOrderTraversal(currentRoot.getRightChild(), result)

    def posOrderTraversal(self):
        """
        Perform a post-order traversal of the tree.

        Post-order traversal visits nodes in this order: Left subtree -> Right subtree -> Node.
        This is useful for deleting trees or computing values bottom-up.
        Prints a message if the tree is empty.

        Returns:
            list: A list of nodes in post-order sequence, or None if tree is empty.

        Time Complexity: O(n) - Visits each node exactly once.
        """
        # Check if the tree is empty
        if self.root is None:
            print("The tree is empty.")
            return None
        else:
            # Create result list for accumulating nodes
            result = []
            # Start recursive post-order traversal from root
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
        # Traverse left subtree first if it exists
        if currentRoot.getLeftChild() is not None:
            self.__posOrderTraversal(currentRoot.getLeftChild(), result)

        # Then traverse right subtree if it exists
        if currentRoot.getRightChild() is not None:
            self.__posOrderTraversal(currentRoot.getRightChild(), result)

        # Process current node last
        result.append(currentRoot)


    # ========================= DELETION OPERATIONS ==========================

    def delete(self, value):
        """
        Delete a node with the given value from the Binary Search Tree.

        This method searches for a node with the provided value and removes it while
        maintaining the BST property. If the tree is empty or the value is not found,
        appropriate messages are printed.

        Args:
            value: The value of the node to delete.

        Time Complexity: O(log n) on average, O(n) in worst case (unbalanced trees).
        """
        if self.root is None:
            print("The tree is empty.")
        else:
            # Search for the node with the given value
            node = self.__search(self.root, value)
            if node is None:
                print(f"The value {value} was not found in the tree.")
            else:
                # Node found, proceed with deletion
                self.__deleteNode(node)

    def __deleteNode(self, node):
        """
        Handle the actual deletion of a node, considering three cases.

        This method evaluates the deletion case based on the number of children
        the node has and calls the appropriate deletion method.

        Args:
            node (Node): The node to delete.
        """
        # Identify which deletion case applies to this node
        nodeCase = self.IdentifyDeletionCase(node)
        match nodeCase:
            case 1:
                # Node is a leaf (no children)
                self.__deleteLeafNode(node)
            case 2:
                # Node has exactly one child
                self.__deleteNodeWithOneChild(node)
            case 3:
                # Node has two children
                self.__deleteNodeWithTwoChilds(node)

    def __deleteLeafNode(self, node):
        """
        Delete a leaf node from the tree by unlinking it from its parent.

        A leaf node is a node with no children. It is simply removed by setting
        the appropriate child pointer of its parent to None.

        Args:
            node (Node): The leaf node to delete.
        """
        parent = node.getParent()
        if parent is None:
            # This node is the root and has no children (only node in tree)
            self.root = None
        elif parent.getLeftChild() is node:
            # Node is the left child of its parent
            parent.setLeftChild(None)
        else:
            # Node is the right child of its parent
            parent.setRightChild(None)
        # Clear the node's parent pointer
        node.setParent(None)

    def __deleteNodeWithOneChild(self, node):
        """
        Delete a node that has exactly one child.

        When a node has one child, it is replaced by that child. The child assumes
        the position of the deleted node in the tree.

        Args:
            node (Node): The node with one child to delete.
        """
        parent = node.getParent()

        # Determine which child exists
        if node.getLeftChild() is not None:
            child = node.getLeftChild()
        else:
            child = node.getRightChild()

        # Special case: the node being deleted is the root
        if parent is None:
            self.root = child
            child.setParent(None)
            return

        # Connect parent directly to the child, bypassing the deleted node
        if parent.getLeftChild() is node:
            parent.setLeftChild(child)
        else:
            parent.setRightChild(child)
        child.setParent(parent)

    def __deleteNodeWithTwoChilds(self, node):
        """
        Delete a node that has both left and right children.

        When a node has two children, we use the in-order predecessor strategy:
        1. Find the maximum value in the left subtree (predecessor)
        2. Replace the node's value with the predecessor's value
        3. Delete the predecessor node from the left subtree

        This maintains the BST property after deletion.

        Args:
            node (Node): The node with two children to delete.
        """
        # Find the in-order predecessor (maximum value in left subtree)
        predecessor = node.getLeftChild()
        while predecessor.getRightChild() is not None:
            predecessor = predecessor.getRightChild()

        # Replace the node's value with the predecessor's value
        node.setValue(predecessor.getValue())

        # Delete the predecessor node from the left subtree
        # The predecessor will have 0 or 1 child (never 2 by nature)
        if predecessor.getLeftChild() is not None:
            self.__deleteNodeWithOneChild(predecessor)
        else:
            self.__deleteLeafNode(predecessor)

    def IdentifyDeletionCase(self, node):
        """
        Identify and return the deletion case for a given node.

        There are three possible cases for node deletion in a BST:
        1. Leaf node: has no children
        2. Node with one child: has either a left or right child, but not both
        3. Node with two children: has both left and right children

        Args:
            node (Node): The node to classify.

        Returns:
            int: 1 for leaf node, 2 for one child, 3 for two children.
        """
        # Case 1: Node is a leaf (no children)
        if node.getLeftChild() is None and node.getRightChild() is None:
            return 1
        # Case 2: Node has exactly one child (XOR logic: one is None, the other is not)
        elif (node.getLeftChild() is None) != (node.getRightChild() is None):
            return 2
        # Case 3: Node has both children
        elif node.getLeftChild() is not None and node.getRightChild() is not None:
            return 3


    # ========================= HEIGHT CALCULATION =============================

    def getHeightNode(self, node):
        """
        Calculate the height of a given node in the tree.

        The height of a node is defined as the longest path from that node to a leaf.
        This method handles None nodes gracefully by returning -1.

        Args:
            node (Node): The node whose height to calculate.

        Returns:
            int: The height of the node, or -1 if the node is None.

        Time Complexity: O(n) where n is the number of nodes in the subtree.
        """
        return -1 if node is None else self.__getHeightNode(node)

    def __getHeightNode(self, node):
        """
        Recursively calculate the height of a node.

        Height is defined as 1 + the maximum height of its two children.
        Leaf nodes have height 0, and None nodes contribute -1 (which balances to 0 for a leaf).

        Args:
            node (Node): The node whose height to calculate.

        Returns:
            int: The height of the node. Returns -1 for None nodes to properly balance parent heights.
        """
        if node is None:
            return -1
        # Calculate height of left subtree
        leftHeight = self.__getHeightNode(node.getLeftChild())
        # Calculate height of right subtree
        rightHeight = self.__getHeightNode(node.getRightChild())
        # Find the greater height value
        maxHeight = max(leftHeight, rightHeight)
        # Return height incremented by 1 to represent the edge to parent
        return maxHeight + 1


    # ========================= TREE VISUALIZATION =============================

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
        a visual representation of the tree structure. It processes the right subtree first
        (displayed above), then the node, then the left subtree (displayed below).

        Args:
            node (Node): The current node to print (subtree root).
            prefix (str): The indentation prefix for alignment of child nodes.
            is_left (bool): Whether this node is a left child (affects connector characters).
        """
        if node is not None:
            # Process right subtree first so it appears above the current node
            if node.getRightChild():
                # Calculate prefix for right child
                new_prefix = prefix + ("│   " if is_left else "    ")
                self.__print_tree(node.getRightChild(), new_prefix, False)

            # Print current node with appropriate connector character
            connector = "└── " if is_left else "┌── "
            print(prefix + connector + str(node.getValue()))

            # Process left subtree so it appears below the current node
            if node.getLeftChild():
                # Calculate prefix for left child
                new_prefix = prefix + ("    " if is_left else "│   ")
                self.__print_tree(node.getLeftChild(), new_prefix, True)
