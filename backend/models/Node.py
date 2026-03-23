class Node:
    """Generic tree node used by BST and AVL implementations.

    The stored value can be any object (e.g., a Flight instance). The node
    keeps references to its parent and children.
    
    IMPORTANT: THE VALUE OF THE NODE WILL BE A FLIGHT OBJECT...
    """

    def __init__(self, value):
        self._value = value
        self._parent = None
        self._leftChild = None
        self._rightChild = None
        self._height = 1  # For AVL balancing

    def getValue(self):
        return self._value
    
    def getHeight(self):
        return self._height

    def setValue(self, value):
        self._value = value

    def setHeight(self, height):
        self._height = height

    def getLeftChild(self):
        return self._leftChild

    def getRightChild(self):
        return self._rightChild

    def getParent(self):
        return self._parent

    def setLeftChild(self, node):
        self._leftChild = node

    def setRightChild(self, node):
        self._rightChild = node

    def setParent(self, node):
        self._parent = node

    def __repr__(self):
        return f"Node({self._value})"
