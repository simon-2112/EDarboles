class Node:
    
    #the value could be an object (for exmp: flight object) 
    def __init__(self, value):
        self._value = value
        self._parent = None
        self._leftChild = None
        self._rightChild = None
        
    
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