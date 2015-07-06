// genereer lines -> verbind lines

// representeer bord -> genereer aanliggende borden

// representeer cluster



var boardSize = 6;

function Line(linecode) {
	this.code = linecode;
	
	this.occupation = function(code) {
		var occupation = [];
		var previousElem = false;

		for (var i = 0; i < code.length; i++) {
			var codeElem = code[i];
			if (previousElem || codeElem) {
				occupation.push(true);
			} else {
				occupation.push(false);
			}
			previousElem = codeElem;
		}
		return occupation;
	}(this.code);

	this.isOccupied = function(i) {
		if (i < 0 || i >= this.occupation.length) {
			return false;
		}
		return this.occupation[i];
	}
}

// TODO
function generateLines() {
	function isValidLine(line) {
		var length = 0;
		var previousElem = 0;
		for (var i = 0; i < line.size; i++) {
			var codeElem = line[i];

			if (codeElem) {
				length += 1;
			}

			previousElem = codeElem;
		}
	}
}

function Board(lines) {
	this.lines = lines;
}



// Test code
var board = new Board([Line(true,true,false,true,false,false)]);

var line = new Line([true, false, true, false, false, false]);

console.log(line.code);
console.log(line.occupation);


