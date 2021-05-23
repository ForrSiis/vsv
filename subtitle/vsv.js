/*
VSV = Versatile Separated Values
Interpret VSV markup into lists, tables, HTML, and JSON

Public Domain - Open standard - No royalty
//*/

var log = console.log;

String.prototype.repeat = String.prototype.repeat ? String.prototype.repeat : function(times) {
	var ret = '';
	for (var i=0; i<times; i++) {
		ret += this;
	}
	return ret;
};

function htmlEntitiesDecode(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

var VSV = VSV || { "mapTo":{} };
VSV.fieldOpener = /^(\[\[|\(\(|\{\{|\<\<)/;
VSV.fieldBrackets = /[\{\(\[\<]{2}(.*?)[\}\)\]\>]{2}/g;
VSV.fileHeader = /[\{\(\[\<]{2}meta[\}\)\]\>]{2}/gi;
VSV.defaultDelims = ",.-=:`|;"; // default delimiters
VSV.defaultBrackets = '[](){}<>';

VSV.getBracketAt = function(n) {
	return VSV.defaultBrackets.charAt(n);
}

VSV.writeField = function(text, br) {
	// br should be desired open bracket
	// e.g. '['

	var dbr = VSV.defaultBrackets;
	var nbr = br ? Math.max(dbr.indexOf(br.charAt(0)), 0) : 0;
	if (nbr % 2 == 1) {
		// turn close bracket into open bracket
		nbr--;
	}
	var obr, cbr;

	//verify obr and cbr not found in text
	var found = true;
	for (var i=0, len=dbr.length/2; i<len; i++) {
		obr = VSV.getBracketAt(nbr);
		cbr = VSV.getBracketAt(nbr+1);

		if (text.indexOf(obr) == -1 && text.indexOf(cbr) == -1) {
			// bracket not found in text, can safely exit loop
			found = false;
			break;
		}

		nbr = (nbr + 2) % dbr.length;
	}

	if (found) {
		throw new Error("No Bracket usable for this string: " + text);
	}

	return (obr + obr + text + cbr + cbr);
}

VSV.writeHeader = function(arr, obr, indent) {
	// arr should be array
	// obr should be desired open bracket
 
	var dbr = VSV.defaultBrackets;
	var nbr = obr ? Math.max(dbr.indexOf(obr.charAt(0)), 0) : 0;
	if (nbr % 2 == 1) {
		// turn close bracket into open bracket
		nbr--;
	}
	br = VSV.getBracketAt(nbr);
	indent = indent || 0;
	var s = '';

	s += ' '.repeat(indent);
	indent = Math.max(indent, 1);
	var spacing = ' '.repeat(indent);

	for (var k in arr) {
		try {
			s += VSV.writeField(arr[k], br);
		} catch(err) {
			console.log(err);
		}
		s += spacing;
	}
	s += '\n';

	return s;
}

VSV.findDelim = function(text, delims) {
	//verify delimiter not found in text

	var del;
	var found = true;
	for (var i=0, len=delims.length; i<len; i++) {
		del = delims.charAt(i);

		if (text.indexOf(del) == -1) {
			// delimiter not found in text, can safely exit loop
			found = false;
			break;
		}
	}

	if (found) {
		throw new Error("No Delimiter usable for this string: " + text);
	}

	return del;
}

VSV.writeData = function(arr, delims, indent) {
	// arr should be array
	// delims should be string
	// indent should be number

	delims = (delims || '') + VSV.defaultDelims;
	var del;
	try {
		del = VSV.findDelim(arr.join(''), delims);
	} catch(err) {
		console.log(err);
		return '';
	}

	var s = '';
	s += ' '.repeat(indent);
	for (var k in arr) {
		var t = arr[k] === 'undefined' ? '' : arr[k];
		s += del + t;
	}
	s += '\n';

	return s;
}

VSV.mapTo.array = function(text, keepDelimiter=false) {
	// convert text rows into array
	// each array item is subarray of header or data items
	// each subarray's 0th index is 'header' or 'data'

	var vsvArray = [];

	var rows = htmlEntitiesDecode(text).split("\n");
	rows.forEach(function(row) {
		row = row.replace( /(^ *| *$)/, ''); // trim spaces only

		if (row.length == 0) {
			return;
		}

		var matches = null;

		if (VSV.fieldOpener.test(row)) {
			// is header row
			// get all fields into array
			matches = row.match(VSV.fieldBrackets);
			(matches) ? matches.splice(0, 0, 'header') : null;
		}
		else {
			// is data row
			var delimiter = row.substring(0, 1);
			row = row.substring(1); // ignore first delimiter
			// ignore if last character is delimiter
			if (row.charAt(row.length-1)==delimiter) {
				row = row.substring(0, row.length-1);
			}
			matches = row.split(delimiter);
			if (matches) {
				if (keepDelimiter) {
					matches.unshift(delimiter);
				}
				matches.unshift('data');
			}
		}

		(matches) ? vsvArray.push(matches) : null;
	});

	return vsvArray;
}

VSV.mapTo.list = function(vsv) {
	if (typeof vsv == "string") {
		vsv = VSV.mapTo.array(vsv);
	}

	var list = document.createElement("ul");
	var stack = [list]; // nested list tree
	var useHeaders = (VSV.fieldBrackets.test(vsv[0][1]) ) ? true : false; // nested list with or without headers
	var lastTier = 0; // nested list last parent = stack[lastTier]

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into list
				var tier = 1;
				var newHeader = false;
				row.forEach(function(header) {
					header = header.replace(VSV.fieldBrackets, "$1");

					if (header.length == 0) {
						tier++;
					}
					else {
						var label = document.createElement("li");
						label.innerText = header;
						var newList = document.createElement("ul");
						label.appendChild(newList);

						if (tier > lastTier) {
							stack[lastTier].appendChild(label);
							stack.push(newList);
							lastTier++;
						}
						else if (tier < lastTier) {
							while (tier <= lastTier) {
								stack.pop();
								lastTier--;
							}
							stack[lastTier].appendChild(label);
							stack.push(newList);
						}
						else {
							stack.pop();
							stack[lastTier-1].appendChild(label);
							stack.push(newList);
						}

						newHeader = true;
					}
				});

				// row with only empty headers will return to that many previous tiers
				if (!newHeader) {
					while (tier > 1 && lastTier) {
						stack.pop();
						lastTier--;
						tier--;
					}
				}
				break;
			case 'data':
				// is data row
				var tier = 0;
				row.forEach(function(data) {
					if (useHeaders) {
						// headers as indentation
						var item = document.createElement("li");
						item.innerText = data;
						stack[lastTier].appendChild(item);
					}
					else {
						// repeated delimiters as indentation
						if (data.length == 0) {
							tier++;
						}
						else {
							var item = document.createElement("li");
							item.innerText = data;
							if (tier > lastTier) {
								lastTier++;
								if (stack[lastTier].nodeName === "LI" ) {
									var newList = document.createElement("ul");
									newList.appendChild(item);
									stack[lastTier].appendChild(newList);
									stack[lastTier] = newList;
								}
								stack[lastTier+1] = item;
							}
							else if (tier < lastTier) {
								lastTier = tier;
								stack[lastTier].appendChild(item);
								stack[lastTier+1] = item;
							}
							else {
								stack[lastTier].appendChild(item);
								stack[lastTier+1] = item;
							}
						}
					}
				});
				break;
		}
	});

	return list;
}

VSV.mapTo.table = function(vsv) {
	if (typeof vsv == "string") {
		vsv = VSV.mapTo.array(vsv);
	}

	var table = document.createElement("table");

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		var tr = document.createElement("tr");
		table.appendChild(tr);

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into table
				row.forEach(function(header) {
					header = header.replace(VSV.fieldBrackets, "$1");
					var th = document.createElement("th");
					tr.appendChild(th);
					th.innerText = header;
				});
				break;
			case 'data':
				// is data row
				// get all values into table
				row.forEach(function(data) {
					var td = document.createElement("td");
					tr.appendChild(td);
					td.innerText = data;
				});
				break;
		}
	});

	return table;
}

VSV.mapTo.xml = function(vsv) {
	if (typeof vsv == "string") {
		vsv = VSV.mapTo.array(vsv);
	}

	var xml = document.createElement("div");
	var stack = [xml]; // DOM tree
	var currTag = xml, lastTag = xml;

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all tags into DOM tree
				row.forEach(function(tag) {
					tag = tag.replace(VSV.fieldBrackets, "$1");

					// determine if opener or closer
					switch (tag) {
						case '/':
							// close current tag and retrieve last tag
							currTag = lastTag = stack.pop();
							break;
						default:
							// add new tag to tree
							stack.push(currTag);
							lastTag = currTag;
							currTag = document.createElement(tag);
							lastTag.appendChild(currTag);
					}
				});
				break;
			case 'data':
				// is data row
				var key = row[0], value = row[1];

				// attribute has key and value
				if (value) {
					currTag.setAttribute(key, value);
				}
				else {
					currTag.appendChild(document.createTextNode(key));
				}
				break;
		}
	});

	return xml;
}

VSV.mapTo.json = function(vsv) {
	if (typeof vsv == "string") {
		vsv = VSV.mapTo.array(vsv);
	}

	var json = "";

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into array
				row.forEach(function(field) {
					var bracketOpen = field.substring(0, 1);
					var bracketClose = field.substring(field.length-1);
					field = field.replace(VSV.fieldBrackets, "$1");

					// determine if object or array, or closing either
					switch (field) {
						case '':
							// unnamed object/array
							json += bracketOpen + " ";
							break;
						case ';':
							// remove extra commas
							json = json.replace( /, *$/, "");
							// close object/array
							json += bracketClose + ", ";
							break;
						default:
							// named object/array
							json += '"' + field + '": ' + bracketOpen + ' ';
					}
				});
				break;
			case 'data':
				// is data row
				var key = row[0], value = row[1];
				// assign "key": "value"
				json += '"' + key + '": "' + value + '", ';
				break;
		}
	});

	// remove extra commas
	json = json.replace( /, *$/, "");

	// debug
	// test if valid JSON
	//var obj = JSON.parse(json);

	return json;
}

VSV.mapTo.vml = function(vsv) {
	if (typeof vsv == "string") {
		vsv = VSV.mapTo.array(vsv, true);
	}

	var xml = document.createElement("div");
	var stack = [xml]; // DOM tree
	var currTag = xml, lastTag = xml;
	var bAttr = false;

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// ignore header rows
				break;
			case 'data':
				// is data row
				var delim = row.shift();
				switch (delim) {
					case '}':
						// close current tag and retrieve last tag
						currTag = lastTag = stack.pop();
						break;
					case '{':
						// add new tag to tree
						stack.push(currTag);
						lastTag = currTag;
						currTag = document.createElement(row[0]);
						lastTag.appendChild(currTag);
						break;
					case '<':
						bAttr = true;
						break;
					case '>':
						bAttr = false;
						break;
					default:
						if (bAttr) {
							// set attribute to current tag
							currTag.setAttribute(row[0].trim(), row[1] || null);
						}
						else {
							// append data to current tag
							currTag.innerText += row[0];
						}

				} // end switch delim
		} // end switch rowType
	});

	return xml;
}


VSV.mapTo.von = function(vsv) {
	if (typeof vsv == "string") {
		vsv = VSV.mapTo.array(vsv, true);
	}

	var ret = {};
	var stack = [ret]; // object tree
	var curr = ret, last = ret;
	var bFunc = false;
	var lastKey = null;

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// ignore header rows
				break;
			case 'data':
				// is data row
				var delim = row.shift();
				switch (delim) {
					case '}':
					case ']':
					case ')':
						// close current and retrieve last
						if (delim == ')') {
							bFunc = false;
							curr += " }";
							last[lastKey] = curr;
						}
						curr = last = stack.pop();
						break;
					case '{':
					case '[':
					case '(':
						// add new object or array or function to tree
						stack.push(curr);
						last = curr;
						if (delim == '{') {
							curr = {};
						}
						else if (delim == '[') {
							curr = [];
						}
						else if (delim == '(') {
							curr = "function";
							bFunc = true;
						}
						if (last.length != undefined) {
							// last is array
							lastKey = last.length;
							last.push(curr);
						}
						else {
							// last is object
							lastKey = row[0];
							last[row[0]] = curr;
						}
						break;
					case '<':
						// add arguments to function
						curr += "( ";
						break;
					case '>':
						// close arguments to function
						curr += " ) {";
						break;
					default:
						if (bFunc) {
							curr += row.join();
						}
						else {
							// add key, value to curr
							var key = row.shift();
							curr[key] = (row.length > 0) ? row.join(', ') : "";
						}

				} // end switch delim
		} // end switch rowType
	});

	return ret;
}
