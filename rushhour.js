var boardCanvas = document.getElementById("boardCanvas");
var context = boardCanvas.getContext("2d");

/**
 * HSV to RGB color conversion
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 * 
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function hsvToRgb(h, s, v) {
	var r, g, b;
	var i;
	var f, p, q, t;
	
	// Make sure our arguments stay in-range
	h = Math.max(0, Math.min(360, h));
	s = Math.max(0, Math.min(100, s));
	v = Math.max(0, Math.min(100, v));
	
	// We accept saturation and value arguments from 0 to 100 because that's
	// how Photoshop represents those values. Internally, however, the
	// saturation and value are calculated from a range of 0 to 1. We make
	// That conversion here.
	s /= 100;
	v /= 100;
	
	if(s == 0) {
		// Achromatic (grey)
		r = g = b = v;
		return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
	}
	
	h /= 60; // sector 0 to 5
	i = Math.floor(h);
	f = h - i; // factorial part of h
	p = v * (1 - s);
	q = v * (1 - s * f);
	t = v * (1 - s * (1 - f));

	switch(i) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
			
		case 1:
			r = q;
			g = v;
			b = p;
			break;
			
		case 2:
			r = p;
			g = v;
			b = t;
			break;
			
		case 3:
			r = p;
			g = q;
			b = v;
			break;
			
		case 4:
			r = t;
			g = p;
			b = v;
			break;
			
		default: // case 5:
			r = v;
			g = p;
			b = q;
	}
	
	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function randomColors(total) {
    var i = 360 / (total - 1); // distribute the colors evenly on the hue range
    var r = []; // hold the generated colors
    for (var x = 0; x < total; x++) {
    	var rgb = hsvToRgb(i * x, 100, 100);
        r.push("rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")"); // you can also alternate the saturation and value for even more contrast between the colors
    }
    return r;
}

function drawBoard() {
	// clear canvas
	boardCanvas.width = boardCanvas.width;

	// draw grid
	context.fillStyle = "black";
	for (var i = 0; i < boardSize; i++) {
		for (var j = 0; j < boardSize; j++) {
			context.strokeRect(i * blockSize, j * blockSize, blockSize, blockSize);
		}
	}

	// draw vehicles
	for (var i = 0; i < vehicles.length; i++) {
		var vehicle = vehicles[i];
		context.fillStyle = vehicle.color;
		context.fillRect(vehicle.x, vehicle.y, vehicle.xSize, vehicle.ySize);
		context.strokeRect(vehicle.x, vehicle.y, vehicle.xSize, vehicle.ySize);
	}

	// draw edges
	context.lineWidth = 5;
	context.moveTo(0, 0);	
	context.lineTo(0, boardCanvas.height);
	context.lineTo(boardCanvas.width, boardCanvas.height);
	context.lineTo(boardCanvas.width, 3 * blockSize);
	context.moveTo(boardCanvas.width, 2 * blockSize);
	context.lineTo(boardCanvas.width, 0);
	context.lineTo(0, 0);
	context.stroke();
}

function snapToGrid(vehicle) {
	var location = getLocation(vehicle);

	vehicle.y = location[1] * blockSize;
	vehicle.x = location[0] * blockSize;

	if (vehicle.orientation) {
		for (var j = 0; j < vehicle.size; j++) {		
			board[location[0]][location[1] + j] = true;
		}
	} else {
		for (var j = 0; j < vehicle.size; j++) {		
			board[location[0] + j][location[1]] = true;
		}
	}
}

function removeFromBoard(vehicle) {
	var location = getLocation(vehicle);

	if (vehicle.orientation) {
		for (var j = 0; j < vehicle.size; j++) {		
			board[location[0]][location[1] + j] = false;
		}
	} else {
		for (var j = 0; j < vehicle.size; j++) {		
			board[location[0] + j][location[1]] = false;
		}
	}
}

function getLocation(vehicle) {
	var unroundedLoc = vehicle.y / blockSize;
	var roundedLocY = unroundedLoc - (unroundedLoc % 1);
	if (unroundedLoc % 1 >= 0.5) {
		roundedLocY++;
	}

	unroundedLoc = vehicle.x / blockSize;
	var roundedLocX = unroundedLoc - (unroundedLoc % 1);
	if (unroundedLoc % 1 >= 0.5) {
		roundedLocX++;
	}

	return [roundedLocX, roundedLocY];
}

boardCanvas.onmouseup = function(e) {
	if (mouseState.dragging) {
		mouseState.dragging = false;
		snapToGrid(mouseState.vehicle);
		drawBoard();
	}
}

boardCanvas.onmousedown = function(e) {
	var mouse = getMouse(e, boardCanvas);

	for (var i = 0; i < vehicles.length; i++) {
		var vehicle = vehicles[i];
		if (vehicle.x <= mouse.x && vehicle.x + vehicle.xSize >= mouse.x &&
			vehicle.y <= mouse.y && vehicle.y + vehicle.ySize >= mouse.y) {
			mouseState.dragging = true;
			mouseState.vehicle = vehicle;

			if (vehicle.orientation) {
				mouseState.offset = mouse.y - vehicle.y;
			} else {
				mouseState.offset = mouse.x - vehicle.x;
			}

			removeFromBoard(vehicle);

			break;
		}
	}
}

boardCanvas.onmousemove = function(e) {
	if (!mouseState.dragging) {
		return;
	}

	var mouse = getMouse(e, boardCanvas);
	var location = getLocation(mouseState.vehicle);
	var minWall = 0;
	var maxWall = boardCanvas.width;

	if (mouseState.vehicle.orientation) {
		var newY = mouse.y - mouseState.offset;
	
		for (var i = location[1]; i >= 0; i--) {
			if (board[location[0]][i]) {
				minWall = (i + 1) * blockSize;
				break;
			}
		}

		for (var i = location[1] + mouseState.vehicle.size; i < boardSize; i++) {
			if (board[location[0]][i]) {
				maxWall = i * blockSize;
				break;
			}
		}

		if (newY < minWall) {
			newY = minWall;
		} else if (newY + mouseState.vehicle.ySize > maxWall) {
			newY = maxWall - mouseState.vehicle.ySize;
		}

		mouseState.vehicle.y = newY;
	} else {
		var newX = mouse.x - mouseState.offset;
	
		for (var i = location[0]; i >= 0; i--) {
			if (board[i][location[1]]) {
				minWall = (i + 1) * blockSize;
				break;
			}
		}

		for (var i = location[0] + mouseState.vehicle.size; i < boardSize; i++) {
			if (board[i][location[1]]) {
				maxWall = i * blockSize;
				break;
			}
		}

		if (newX < minWall) {
			newX = minWall;
		} else if (newX + mouseState.vehicle.xSize > maxWall) {
			newX = maxWall - mouseState.vehicle.xSize;
		}

		mouseState.vehicle.x = newX;
	}

	drawBoard();
}

function getMouse(e, canvas) {
    var element = canvas,
        offsetX = 0,
        offsetY = 0,
        mx, my;

    // Compute the total offset. It's possible to cache this if you want
    if (element.offsetParent !== undefined) {
        do {
            offsetX += element.offsetLeft;
            offsetY += element.offsetTop;
        } while ((element = element.offsetParent));
    }

    mx = e.pageX - offsetX;
    my = e.pageY - offsetY;

    // We return a simple javascript object with x and y defined
    return {
        x: mx,
        y: my
    };
}

function Vehicle(posX, posY, orientation, size) {
	this.x = posX * blockSize;
	this.y = posY * blockSize;
	this.orientation = orientation;
	this.size = size;

	if (this.orientation) {
		this.ySize = size * blockSize;
		this.xSize = blockSize;
	} else {
		this.xSize = size * blockSize;
		this.ySize = blockSize;
	}

	this.defaultColor = "black";
	this.color = this.defaultColor;
}
Vehicle.prototype = {
	constructor : Vehicle,

	changeColor : function(color) {
		this.color = color;
	}
}


function initVehiclesSubclusterExample(board) {
	var vehicles = [];
	vehicles[0] = new Vehicle(3, 2, false, 2);
	snapToGrid(vehicles[0]);
	vehicles[1] = new Vehicle(3, 0, false, 2);
	snapToGrid(vehicles[1]);
	vehicles[2] = new Vehicle(2, 0, true, 3);
	snapToGrid(vehicles[2]);
	vehicles[3] = new Vehicle(2, 3, true, 3);
	snapToGrid(vehicles[3]);
	vehicles[4] = new Vehicle(0, 2, false, 2);
	snapToGrid(vehicles[4]);
	return vehicles;
}

function initVehiclesFillingPickingExample(board) {
	var vehicles = [];
	vehicles[0] = new Vehicle(4, 2, false, 2);
	snapToGrid(vehicles[0]);
	//vehicles[1] = new Vehicle(3, 3, false, 3);
	//snapToGrid(vehicles[1]);
	vehicles[1] = new Vehicle(2, 0, true, 3);
	snapToGrid(vehicles[1]);
	return vehicles;
}

function initVehiclesMoveExample(board) {
	var vehicles = [];
	vehicles[0] = new Vehicle(3, 2, false, 2);
	snapToGrid(vehicles[0]);
	vehicles[1] = new Vehicle(5, 2, true, 3);
	snapToGrid(vehicles[1]);
	vehicles[2] = new Vehicle(3, 5, false, 3);
	snapToGrid(vehicles[2]);
	vehicles[3] = new Vehicle(2, 4, true, 2);
	snapToGrid(vehicles[3]);
	return vehicles;
}

function initBoard() {
	var board = [];

	for (var i = 0; i < boardSize; i++) {
		board[i] = [];
		for (var j = 0; j < boardSize; j++) {
			board[i][j] = false;
		}
	}

	return board;
}

function extractVehicles(solverBoard){
	var vehicles = [];

	for (var i = 0; i < solverBoard.lines.length; i++) {
		var line = solverBoard.lines[i];
		var solverVehicles = line.cars.concat(line.trucks);
		var orientation = i < boardSize;

		for (var j = 0; j < solverVehicles.length; j++) {
			var solverVehicle = solverVehicles[j];
			
			if (i < boardSize) {
				vehicles.push(new Vehicle(i, solverVehicle.location, orientation, solverVehicle.size));
			} else {
				vehicles.push(new Vehicle(solverVehicle.location, i - boardSize, orientation, solverVehicle.size));
			}
		}

		// turn the red car's color to red.
		if (i == boardSize + Math.floor(boardSize / 2) - 1) {
			vehicles[vehicles.length - 1].changeColor("red");			
		}
	}
	return vehicles;
}

function showAsImage() {
	var img = boardCanvas.toDataURL("image/png");
	document.write('<img src="' + img + '"/>');
}

var boardSize = 6;
var blockSize = boardCanvas.width / 6;

var board = initBoard();
//var vehicles = initVehicles(board, boardJava.getRows(), boardJava.getColumns());
//var vehicles = initVehiclesSubclusterExample(board);
//var vehicles = initVehiclesMoveExample(board);

var vehicles = extractVehicles(solverBoard);
var colors = randomColors(vehicles.length);
for (var i = 0; i < vehicles.length; i++) {
	if (vehicles[i].color == vehicles[i].defaultColor) {
		vehicles[i].changeColor(colors[i]);
	}
}

var mouseState = {};
mouseState.dragging = false;
mouseState.vehicle = vehicles[0];
mouseState.offset = 0;

drawBoard();
//showAsImage();