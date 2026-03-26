from copy import deepcopy

class VersionService:

    def __init__(self):
        self.versions = {}  # { "nombre": avlTree }

    def saveVersion(self, name, tree):
        if not name:
            raise Exception("Version name is required")

        self.versions[name] = deepcopy(tree)

    def loadVersion(self, name):
        return None if name not in self.versions else deepcopy(self.versions[name])

    def getAllVersions(self):
        return list(self.versions.keys())