/*
VSV = Versatile Separated Values
Interpret VSV markup into lists, tables, HTML, and JSON

Public Domain - Open standard - No royalty
//*/


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

	var list = document.createElement("dl");

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into list
				row.forEach(function(header) {
					header = header.replace(VSV.fieldBrackets, "$1");
					var dt = document.createElement("dt");
					var span = document.createElement("span");
					span.style.display = "inline-block";
					span.innerText = header;
					dt.appendChild(span);
					list.appendChild(dt);
				});
				break;
			case 'data':
				// is data row
				row.forEach(function(data) {
					var dd = document.createElement("dd");
					dd.innerText = data; // ignore first delimiter
					list.appendChild(dd);
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
	var stack = [xml];
	var currTag = xml, lastTag = xml;

	// parse by row
	vsv.forEach(function(row) {
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into array
				row.forEach(function(tag) {
					tag = tag.replace(VSV.fieldBrackets, "$1");

					// determine if opener or closer
					switch (tag) {
						case '/':
							// close current tag and retrieve last tag
							currTag = lastTag = stack.pop();
							break;
						default:
							// add new tag to hierarchy
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
