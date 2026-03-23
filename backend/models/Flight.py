import json
from datetime import datetime


class Flight:
    """
    Flight class representing an airline flight with passenger and pricing information.

    This class encapsulates all flight details including identification, passenger count,
    pricing with promotional discounts, scheduling information, and route details.

    Attributes:
        _idFlight (int): Unique identifier for the flight.
        _numberPassengers (int): Number of passengers on the flight.
        _promotion (float): Promotional discount as a percentage (0-100).
        _price (float): Base ticket price in currency units.
        _priority (int): Priority level calculated based on flight criteria.
        _departureDate (datetime): Date and time of departure.
        _arrivalDate (datetime): Date and time of arrival.
        _departureCity (str): Name of the departure city.
        _arrivalCity (str): Name of the arrival city.
        _duration (float): Flight duration in hours.
    """

    def __init__(self, idFlight=None, numberPassengers=0, promotion=False, price=0.0,
                priority=0, departureDate=None, departureCity="",
                arrivalCity="", duration=0.0):
        """
        Initialize a Flight object with the provided parameters.

        Args:
            idFlight (int, optional): Unique flight identifier. Defaults to None.
            numberPassengers (int, optional): Number of passengers. Defaults to 0.
            promotion (boolean, optional): There are promotion or not. Defaults False
            price (float, optional): Base ticket price. Defaults to 0.0.
            priority (int, optional): Flight priority level. Defaults to 0.
            departureDate (datetime, optional): Departure date and time. Defaults to None.
            departureCity (str, optional): Departure city name. Defaults to empty string.
            arrivalCity (str, optional): Arrival city name. Defaults to empty string.
            duration (float, optional): Flight duration in hours. Defaults to 0.0.
        """
        self._idFlight = idFlight
        self._numberPassengers = numberPassengers
        self._promotion = promotion
        self._price = price
        self._priority = priority
        self._departureDate = departureDate
        self._departureCity = departureCity
        self._arrivalCity = arrivalCity
        self._duration = duration

    # ======================== GETTERS ================================

    def getIdFlight(self):
        """Get the unique flight identifier."""
        return self._idFlight

    def getNumberPassengers(self):
        """Get the number of passengers on this flight."""
        return self._numberPassengers

    def getPromotion(self):
        """Get the promotional discount state"""
        return self._promotion

    def getPrice(self):
        """Get the base ticket price."""
        return self._price

    def getPriority(self):
        """Get the flight priority level."""
        return self._priority

    def getDepartureDate(self):
        """Get the departure date and time."""
        return self._departureDate

    def getDepartureCity(self):
        """Get the departure city name."""
        return self._departureCity

    def getArrivalCity(self):
        """Get the arrival city name."""
        return self._arrivalCity

    def getDuration(self):
        """Get the flight duration in hours."""
        return self._duration

    # ======================== SETTERS ================================

    def setIdFlight(self, idFlight):
        """
        Set the unique flight identifier.

        Args:
            idFlight (int): The flight ID to set.
        """
        self._idFlight = idFlight

    def setNumberPassengers(self, numberPassengers):
        """
        Set the number of passengers on this flight.

        Args:
            numberPassengers (int): Number of passengers. Should be non-negative.
        """
        if numberPassengers < 0:
            raise ValueError("Number of passengers cannot be negative.")
        self._numberPassengers = numberPassengers

    def setPromotion(self, promotion):
        self._promotion = promotion

    def setPrice(self, price):
        """
        Set the base ticket price.

        Args:
            price (float): Ticket price. Should be non-negative.

        Raises:
            ValueError: If price is negative.
        """
        if price < 0:
            raise ValueError("Price cannot be negative.")
        self._price = price

    def setPriority(self, priority):
        """
        Set the flight priority level.

        Args:
            priority (int): Priority level. 1-5 or similar range.
        """
        if priority < 1 or priority > 5:
            raise ValueError("Priority should be between 1 and 5.")
        
        self._priority = priority

    def setDepartureDate(self, departureDate):
        """
        Set the departure date and time.

        Args:
            departureDate (datetime): The departure datetime object.
        """
        self._departureDate = departureDate

    def setDepartureCity(self, departureCity):
        """
        Set the departure city name.

        Args:
            departureCity (str): City name for departure.
        """
        self._departureCity = departureCity

    def setArrivalCity(self, arrivalCity):
        """
        Set the arrival city name.

        Args:
            arrivalCity (str): City name for arrival.
        """
        self._arrivalCity = arrivalCity

    def setDuration(self, duration):
        """
        Set the flight duration in hours.

        Args:
            duration (float): Duration in hours. Should be non-negative.

        Raises:
            ValueError: If duration is negative.
        """
        if duration < 0:
            raise ValueError("Duration cannot be negative.")
        self._duration = duration

    # ======================== UTILITY METHODS ================================

    def calculateFinalPrice(self):
        """
        Calculate the final ticket price after applying the promotional discount.

        Formula: finalPrice = price * (1 - promotion/100)

        Returns:
            float: The final ticket price after discount.
        """
        discountFactor = 1 - (self._promotion / 100)
        return self._price * discountFactor

    def calculateTotalRevenue(self):
        """
        Calculate total revenue for this flight (all passengers combined).

        Returns:
            float: Total revenue = finalPrice * numberPassengers.
        """
        return self.calculateFinalPrice() * self._numberPassengers

    def calculatePriority(self):
        """
        Calculate and update the flight priority based on multiple criteria.

        Priority is determined by:
        - Higher passenger count increases priority
        - Higher price increases priority (premium flights)
        - Lower promotion/discounts increase priority (full-price flights)

        Returns:
            int: Calculated priority level (1-5 scale).
        """
        # Normalize factors (0-1 scale)
        passengerFactor = min(self._numberPassengers / 300, 1.0)  # Normalize to capacity ~300
        priceFactor = min(self._price / 1000, 1.0)  # Normalize to typical max price
        discountFactor = (100 - self._promotion) / 100  # Less discount = higher priority

        # Calculate weighted priority
        weightedPriority = (passengerFactor * 0.3) + (priceFactor * 0.4) + (discountFactor * 0.3)

        # Convert to 1-5 scale
        priority = int(weightedPriority * 5) + 1
        priority = max(1, min(priority, 5))  # Ensure within 1-5 range

        self._priority = priority
        return self._priority

    def isValidFlight(self):
        """
        Validate if the flight has all required information.

        Checks that all essential flight details are properly set and logical.

        Returns:
            bool: True if flight is valid, False otherwise.
        """
        # Check if all required fields are set
        if self._idFlight is None:
            return False
        if self._departureDate is None or self._arrivalDate is None:
            return False
        if not self._departureCity or not self._arrivalCity:
            return False
        if self._price is None or self._price < 0:
            return False
        if self._numberPassengers < 0:
            return False

        # Check if departure is before arrival
        if self._departureDate >= self._arrivalDate:
            return False

        # Check if departure and arrival cities are different
        return self._departureCity != self._arrivalCity

    def toJSON(self):
        """
        Convert the Flight object to a JSON-serializable dictionary.

        Converts datetime objects to ISO format strings for JSON compatibility.

        Returns:
            dict: A dictionary representation of the flight with all attributes.
        """
        return {
            "idFlight": self._idFlight,
            "numberPassengers": self._numberPassengers,
            "promotion": self._promotion,
            "price": self._price,
            "priority": self._priority,
            "departureDate": self._departureDate.isoformat() if self._departureDate else None,
            "departureCity": self._departureCity,
            "arrivalCity": self._arrivalCity,
            "duration": self._duration,
            "finalPrice": self.calculateFinalPrice(),
            "totalRevenue": self.calculateTotalRevenue()
        }

    def toJSONString(self):
        """
        Convert the Flight object to a JSON string.

        Returns:
            str: JSON string representation of the flight.
        """
        return json.dumps(self.toJSON(), indent=2)

    def __str__(self):
        """
        Return a human-readable string representation of the flight.

        Returns:
            str: Formatted flight information.
        """
        return (f"Flight #{self._idFlight}: {self._departureCity} -> {self._arrivalCity} | "
                f"Passengers: {self._numberPassengers} | Price: ${self._price:.2f} | "
                f"Promotion: {self._promotion}% | Priority: {self._priority}")

    def __repr__(self):
        """
        Return a detailed string representation for debugging.

        Returns:
            str: Detailed flight information.
        """
        return (f"Flight(idFlight={self._idFlight}, numberPassengers={self._numberPassengers}, "
                f"promotion={self._promotion}, price={self._price}, priority={self._priority}, "
                f"departureDate={self._departureDate},"
                f"departureCity={self._departureCity}, arrivalCity={self._arrivalCity}, "
                f"duration={self._duration})")

    def _get_numeric_id(self):
        """
            this method help us to convert our flight string id to a numeric value comparable.
        """
        if isinstance(self._idFlight, str):
            if digits := ''.join(filter(str.isdigit, self._idFlight)):
                return int(digits)
            else:
                raise ValueError(f"idFlight inválido: {self._idFlight} no contiene números")
        return self._idFlight


    def __lt__(self, other):
        """
        Compare this flight with another flight based on their numeric IDs.

        This method enables ordering of Flight instances using the less-than operator.

        Args:
            other (Flight): Another flight instance to compare against.

        Returns:
            bool: True if this flight's numeric ID is less than the other's, False otherwise.
        """
        if not isinstance(other, Flight):
            return NotImplemented
        return self._get_numeric_id() < other._get_numeric_id()


    def __gt__(self, other):
        """
        Compare this flight with another flight based on their numeric IDs.

        This method enables ordering of Flight instances using the greater-than operator.

        Args:
            other (Flight): Another flight instance to compare against.

        Returns:
            bool: True if this flight's numeric ID is greater than the other's, False otherwise.
        """
        if not isinstance(other, Flight):
            return NotImplemented
        return self._get_numeric_id() > other._get_numeric_id()


    def __eq__(self, other):
        """
        Determine if two flights are equal based on their numeric IDs.

        This method supports equality comparison between Flight instances.

        Args:
            other (Flight): Another flight instance to compare against.

        Returns:
            bool: True if both flights have the same numeric ID, False otherwise.
        """
        if not isinstance(other, Flight):
            return NotImplemented
        return self._get_numeric_id() == other._get_numeric_id()

    def __hash__(self):
        """
        Return hash of the flight based on its ID for use in sets/dicts.

        Returns:
            int: Hash value based on flight ID.
        """
        return hash(self._idFlight)
    