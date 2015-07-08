// genereer lines -> verbind lines

// representeer bord -> genereer aanliggende borden

// representeer cluster

var boardSize = 6;

function Car(location) {
	this.location = location;
	this.size = 2;
}


function Truck(location) {
	this.location = location;
	this.size = 3;
}

function Connection(line1, line2) {
	this.line1 = line1;
	this.line2 = line2;
	this.requirements = function(line1, line2) {
		var requirements = [];

		var vehicles1 = line1.cars.concat(line1.trucks);
		var vehicles2 = line2.cars.concat(line2.trucks);

		for (var i = 0; i < vehicles1.length; i++) {
			var distance = Math.abs(vehicles1[i].location - vehicles2[i].location);

			if (vehicles1[i].location < vehicles2[i].location) {
				 for (var j = 0; j < distance; j++) {
					requirements.push(vehicles1[i].location + vehicles1[i].size + j);	 	
				 }
			}
			else if (vehicles1[i].location > vehicles2[i].location) {
				 for (var j = 0; j < distance; j++) {
					requirements.push(vehicles1[i].location - j);	 	
				 }
			}
		}

		return requirements;
	}(this.line1, this.line2);
}

function Line(linecode) {
	this.code = linecode;
	this.connections = [];

	this.occupation = function(code) {
		var occupation = [];
		var previousElem = false;

		for (var i = 0; i < code.length; i++) {
			var codeElem = code[i];
			occupation.push(previousElem || codeElem);
			previousElem = codeElem;
		}
		return occupation;
	}(this.code);

	this.cars = [];
	this.trucks = [];
	this.vehicleOrder = function(code, cars, trucks) {
		var length = 0;
		var vehicleOrder = 0;

		for (var i = 0; i < code.length; i++) {
			if (code[i]) {
				length += 1;
			} else if (length > 0) {
				length += 1;
				if (length == 2) {
					var car = new Car(i - length + 1);
					cars.push(car);
					vehicleOrder *= 10;
					vehicleOrder += car.size;
				}
				if (length == 3) {
					var truck = new Truck(i - length + 1);
					trucks.push(truck);
					vehicleOrder *= 10;
					vehicleOrder += truck.size;
				}
				length = 0;
			}
		}
		return vehicleOrder;
	}(this.code, this.cars, this.trucks);
}

Line.prototype = {
	constructor : Line,
	
	isOccupied : function(i) {
		if (i < 0 || i >= occupation.length) {
			return false;
		}
		return occupation[i];
	},

	addConnection : function(line) {
		if (this.code == line.code) {
			return false;
		}

		if (this.cars.length != line.cars.length || this.trucks.length != line.trucks.length) {
			return false;
		}

		if (this.vehicleOrder != line.vehicleOrder) {
			return false;
		}
		
		var nVehiclesMoved = 0;

		for (var i = 0; i < this.cars.length; i++) {
			if (this.cars[i].location != line.cars[i].location) {
				nVehiclesMoved += 1;
			}
		}

		for (var i = 0; i < this.trucks.length; i++) {
			if (this.trucks[i].location != line.trucks[i].location) {
				nVehiclesMoved += 1;
			}
		}

		if (nVehiclesMoved == 1) {
			this.connections.push(new Connection(this, line));
			return true;
		}
		return false;
	}
}

function generateLines() {
	function isValidCode(code) {
		var length = 0;
		var previousElem = false;

		for (var i = 0; i < code.length; i++) {
			var codeElem = code[i];

			if (codeElem) {
				length += 1;
			} else if (previousElem) {
				length += 1;
				if (length < 2 || length > 3) {
					return false;
				}
				length = 0;
			}
 
			previousElem = codeElem;
		}

		if (code[code.length - 1]) {
			return false;
		}

		return true;
	}

	function integerToCode(number) {
		var bits = [];
	    for (var i = boardSize - 1; i >= 0; i--) {
	        bits.push((number & (1 << i)) != 0);
	    }
	    return bits;
	}
	
	function connectLines(lines) {
		for (var i = 0; i < lines.length; i++) {
			for (var j = 0; j < lines.length; j++) {
				lines[i].addConnection(lines[j]);
			}
		}
	}

	var lines = [];
	for (var i = 0; i < Math.pow(2, boardSize); i++) {
		var code = integerToCode(i);
		if (isValidCode(code)) {
			lines.push(new Line(code));
		}
	}

	connectLines(lines);

	return lines;
}


var lines = generateLines();

for (var i = 0; i < lines.length; i++) {
	var line = lines[i];
	console.log(line.code);
	console.log(line.connections.length);
	for (var j = 0; j < line.connections.length; j++) {
		var otherLine = line.connections[j].line2;
		console.log("     " + otherLine.code.toString());
	}
}

function Board(lines) {
	this.lines = lines;
}




/*
// Test code
var board = new Board([new Line(true,true,false,true,false,false)]);

var line = new Line([true, false, true, false, false, false]);

console.log(line.code);
console.log(line.occupation);
*/

