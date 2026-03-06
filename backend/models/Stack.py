class Stack:
    
    def __init__(self):
        self._data = []
    
    def push(self, value):
        self._data.append(value)
    
    def pop(self):
        if(self.isEmpty()):
            raise IndexError("the stack is empty, you can't pop an element")
        return self._data.pop()
    
    def isEmpty(self):
        return len(self._data) == 0
    
    def getTop(self):
        if(self.isEmpty()):
            raise IndexError("the stack is empty")
        return self._data[-1]
    
    def getData(self):
        return self._data.copy()