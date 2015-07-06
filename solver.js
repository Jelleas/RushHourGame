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
		for (var i = 0; i < line.size; i++) {
			var codeElem = line
			previousElem = codeElem;
		}
	}
}

var line = new Line([true, false, true, false, false, false]);

console.log(line.code);
console.log(line.occupation);
