#this is a file only for debbuging purposes.
from utils import utils
import json

def main():
    content = utils.readJson()  
    print(f"content: {content}")      
    parser = json.loads(content)

    parser[0]["root"] = {"value": 10, "left": None, "right": None}

    parser = json.dumps(parser, indent=4)

    utils.writeJson(parser)

if __name__ == "__main__":
    main()