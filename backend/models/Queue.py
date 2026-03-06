from collections import deque
class Queue:
    
    def __init__(self):
        self._data = deque()
    
    def enqueue(self, value):
        self._data.append(value)
    
    def dequeue(self):
        if(self.isEmpty()):
            raise IndexError("the queue is empty, you can't dequeue an element")
        return self._data.popleft()
    
    def isEmpty(self):
        return len(self._data) == 0
    
    def getFirst(self):
        if(self.isEmpty()):
            raise IndexError("the queue is empty")
        return self._data[0]
    
    def getData(self):
        return self._data.copy()
