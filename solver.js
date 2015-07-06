var boardSize = 6;

function Line(linecode) {
	this.code = linecode;
	
	/*this.occupation = function() {
		var occupation = [];
		var previousElem = false;
		for (var i; i < this.code.length; i++) {
			var codeElem = this.code[i];
			if (previousElem || codeElem) {
				occupation.push(true);
			}

			previousElem = codeElem;
		}
		return occupation;
	}();*/
}


var line = Line([1,0,1,0,0,0]);
alert(line);

// genereer lines -> verbind lines

// representeer bord -> genereer aanliggende borden

// representeer cluster

