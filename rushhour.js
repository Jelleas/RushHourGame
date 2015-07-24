function GameView() {
	var view = this;

	this.boardCanvas = document.getElementById("boardCanvas");
	this.boardSize = 6;
	this.blockSize = boardCanvas.width / 6;
	this.vehicles = [];
	this.board = function() {
		var board = [];

		for (var i = 0; i < view.boardSize; i++) {
			board[i] = [];
			for (var j = 0; j < view.boardSize; j++) {
				board[i][j] = false;
			}
		}

		return board;
	}();



	var mouseState = {};
	mouseState.dragging = false;
	mouseState.vehicle = this.vehicles[0];
	mouseState.offset = 0;

	// Callback for retrieving mouse location. 
	function getMouse(e, canvas) {
	    var element = canvas,
	        offsetX = 0,
	        offsetY = 0,
	        mx, my;

	    if (element.offsetParent !== undefined) {
	        do {
	            offsetX += element.offsetLeft;
	            offsetY += element.offsetTop;
	        } while ((element = element.offsetParent));
	    }

	    mx = e.pageX - offsetX;
	    my = e.pageY - offsetY;

	    return {
	        x: mx,
	        y: my
	    };
	}

	boardCanvas.onmouseup = function(e) {
		if (mouseState.dragging) {
			mouseState.dragging = false;
			view.snapToGrid(mouseState.vehicle);
			view.draw();
		}
	}

	boardCanvas.onmousedown = function(e) {
		var mouse = getMouse(e, boardCanvas);

		for (var i = 0; i < view.vehicles.length; i++) {
			var vehicle = view.vehicles[i];
			if (vehicle.x <= mouse.x && vehicle.x + vehicle.xSize >= mouse.x &&
				vehicle.y <= mouse.y && vehicle.y + vehicle.ySize >= mouse.y) {
				mouseState.dragging = true;
				mouseState.vehicle = vehicle;

				if (vehicle.orientation) {
					mouseState.offset = mouse.y - vehicle.y;
				} else {
					mouseState.offset = mouse.x - vehicle.x;
				}

				view.removeFromBoard(vehicle);

				break;
			}
		}
	}

	boardCanvas.onmousemove = function(e) {
		if (!mouseState.dragging) {
			return;
		}

		var mouse = getMouse(e, boardCanvas);
		var location = view.getLocation(mouseState.vehicle);
		var minWall = 0;
		var maxWall = view.boardCanvas.width;

		if (mouseState.vehicle.orientation) {
			var newY = mouse.y - mouseState.offset;
		
			for (var i = location[1]; i >= 0; i--) {
				if (view.board[location[0]][i]) {
					minWall = (i + 1) * view.blockSize;
					break;
				}
			}

			for (var i = location[1] + mouseState.vehicle.size; i < view.boardSize; i++) {
				if (view.board[location[0]][i]) {
					maxWall = i * view.blockSize;
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
				if (view.board[i][location[1]]) {
					minWall = (i + 1) * view.blockSize;
					break;
				}
			}

			for (var i = location[0] + mouseState.vehicle.size; i < view.boardSize; i++) {
				if (view.board[i][location[1]]) {
					maxWall = i * view.blockSize;
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

		view.draw();
	}


	this.Vehicle = function(posX, posY, orientation, size) {
		this.x = posX * view.blockSize;
		this.y = posY * view.blockSize;
		this.orientation = orientation;
		this.size = size;

		if (this.orientation) {
			this.ySize = size * view.blockSize;
			this.xSize = view.blockSize;
		} else {
			this.xSize = size * view.blockSize;
			this.ySize = view.blockSize;
		}

		this.defaultColor = "black";
		this.color = this.defaultColor;
	}
	this.Vehicle.prototype = {
		constructor : view.Vehicle,

		changeColor : function(color) {
			this.color = color;
		}
	}
}
GameView.prototype = {
	constructor : GameView,

	draw : function() {
		var context = boardCanvas.getContext("2d");

		// clear canvas
		this.boardCanvas.width = this.boardCanvas.width;

		// draw grid
		context.fillStyle = "black";
		for (var i = 0; i < this.boardSize; i++) {
			for (var j = 0; j < this.boardSize; j++) {
				context.strokeRect(i * this.blockSize, j * this.blockSize, this.blockSize, this.blockSize);
			}
		}

		// draw vehicles
		for (var i = 0; i < this.vehicles.length; i++) {
			var vehicle = this.vehicles[i];
			context.fillStyle = vehicle.color;
			context.fillRect(vehicle.x, vehicle.y, vehicle.xSize, vehicle.ySize);
			context.strokeRect(vehicle.x, vehicle.y, vehicle.xSize, vehicle.ySize);
		}

		// draw edges
		context.lineWidth = 5;
		context.moveTo(0, 0);	
		context.lineTo(0, this.boardCanvas.height);
		context.lineTo(this.boardCanvas.width, this.boardCanvas.height);
		context.lineTo(this.boardCanvas.width, 3 * this.blockSize);
		context.moveTo(this.boardCanvas.width, 2 * this.blockSize);
		context.lineTo(this.boardCanvas.width, 0);
		context.lineTo(0, 0);
		context.stroke();
	},

	load : function(solverBoard) {
		function generateColors(n) {
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

			return randomColors(n);
		}

		function extractVehicles(view, solverBoard){
			var vehicles = [];

			for (var i = 0; i < solverBoard.lines.length; i++) {
				var line = solverBoard.lines[i];
				var solverVehicles = line.cars.concat(line.trucks);
				var orientation = i < boardSize;

				for (var j = 0; j < solverVehicles.length; j++) {
					var solverVehicle = solverVehicles[j];
					if (i < boardSize) {
						vehicles.push(new view.Vehicle(i, solverVehicle.location, orientation, solverVehicle.size));
					} else {
						vehicles.push(new view.Vehicle(solverVehicle.location, i - boardSize, orientation, solverVehicle.size));
					}
				}

				// turn the red car's color to red.
				if (i == boardSize + Math.floor(boardSize / 2) - 1) {
					vehicles[vehicles.length - 1].changeColor("red");			
				}
			}
			return vehicles;
		}

		function colorVehicles(vehicles) {
			var colors = generateColors(vehicles.length);
			for (var i = 0; i < vehicles.length; i++) {
				if (vehicles[i].color == vehicles[i].defaultColor) {
					vehicles[i].changeColor(colors[i]);
				}
			}
			return vehicles;
		}

		this.vehicles = extractVehicles(this, solverBoard);
		this.vehicles = colorVehicles(this.vehicles);
	},

	snapToGrid : function(vehicle) {
		var location = this.getLocation(vehicle);

		vehicle.y = location[1] * this.blockSize;
		vehicle.x = location[0] * this.blockSize;

		if (vehicle.orientation) {
			for (var j = 0; j < vehicle.size; j++) {		
				this.board[location[0]][location[1] + j] = true;
			}
		} else {
			for (var j = 0; j < vehicle.size; j++) {		
				this.board[location[0] + j][location[1]] = true;
			}
		}
	},

	getLocation : function(vehicle) {
		var unroundedLoc = vehicle.y / this.blockSize;
		var roundedLocY = unroundedLoc - (unroundedLoc % 1);
		if (unroundedLoc % 1 >= 0.5) {
			roundedLocY++;
		}

		unroundedLoc = vehicle.x / this.blockSize;
		var roundedLocX = unroundedLoc - (unroundedLoc % 1);
		if (unroundedLoc % 1 >= 0.5) {
			roundedLocX++;
		}

		return [roundedLocX, roundedLocY];
	},

	removeFromBoard : function(vehicle) {
		var location = this.getLocation(vehicle);

		if (vehicle.orientation) {
			for (var j = 0; j < vehicle.size; j++) {		
				this.board[location[0]][location[1] + j] = false;
			}
		} else {
			for (var j = 0; j < vehicle.size; j++) {	
				this.board[location[0] + j][location[1]] = false;
			}
		}
	},

	showAsImage : function() {
		var img = this.boardCanvas.toDataURL("image/png");
		document.write('<img src="' + img + '"/>');
	}
}

// main
gameView = new GameView();
gameView.draw();