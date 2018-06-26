/*
VSV = Versatile Separated Values
Interpret VSV markup into lists, tables, HTML, and JSON

Public Domain - Open standard - No royalty
//*/

var log = console.log;

function htmlEntitiesDecode(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

var VSV = VSV || { "mapTo":{} };
VSV.fieldOpener = /(\[\[|\(\(|\{\{|\<\<)/;
VSV.fieldBrackets = /[\{\(\[\<]{2}(.*?)[\}\)\]\>]{2}/g;

VSV.mapTo.array = function(text) {
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
			(matches) ? matches.splice(0, 0, 'data') : null;
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
