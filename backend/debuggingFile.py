# this is a file only for debbuging purposes.
from utils.utils import *
from services.flightTreeService import TreeService
from services.stressModeService import StressService
from models.Flight import Flight
import json


def main():
    # pass
    service = TreeService()
    stress = StressService(service)
    data = readJson("./data/insercionPrueba.json")
    # this is only for test purposes, data is obtained from the frontend
    service.createTree(data)
    service.toPrintAvl()
    print()
    print("este es el candidato final:      ", service.deleteLowestProfitFlight())
    print()
    


if __name__ == "__main__":
    main()
