#we can get there for example methods to read and write JSON files, or create methods for iterative patterns.

from pathlib import Path

jsonDataRoute = Path(__file__).resolve().parent.parent / "data" / "tree.json"

def readJson():
    with open(jsonDataRoute, "r") as archive:
        jsonContent = archive.read()
    return jsonContent

def writeJson(jsonData):
    print(f"jsonData: {jsonData}")
    with open(jsonDataRoute, "w") as archive:
        archive.write(jsonData)
        print(f"Content written to {jsonDataRoute}")

def addContentToJson(newContent):
    if(newContent == "" or newContent is None):
        return
    print(f"newContent: {newContent}")
    with open(jsonDataRoute, "a") as archive:
        newContent = f",{newContent}"
        archive.write(str(newContent))
        print(f"Content added to {jsonDataRoute}")