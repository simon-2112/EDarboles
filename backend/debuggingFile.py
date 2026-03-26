# this is a file only for debbuging purposes.
from utils.utils import *
from services.flightTreeService import TreeService
from models.Flight import Flight
import json


def main():
    # pass
    service = TreeService()
    data = readJson("./data/insercionPrueba.json")
    # this is only for test purposes, data is obtained from the frontend
    service.createTree(data)
    service.toPrintAvl()
    

    service.toPrintAvl()
    
    print(service.getMetrics())


if __name__ == "__main__":
    main()
