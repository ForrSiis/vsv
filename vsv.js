/*
VSV = Versatile Separated Values
Interpret VSV markup into HTML tables and lists

Public Domain - Open standard - No royalty
//*/

(function() {

var FIELD_OPENER = /(\[\[|\(\(|\{\{|\<\<)/;
var FIELD_BRACKETS = /[\{\(\[\<]{2}(.*?)[\}\)\]\>]{2}/g;
var JSON_BRACKET = /^ *[\{\[]/;

function htmlEntitiesDecode(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function vsvRow2Array(text) {
	// convert text rows into array
	// each array item is subarray of header or data items
	// each subarray's 0th index is 'header' or 'data'

	var vsvArray = [];

	var rows = htmlEntitiesDecode(text).split("\n");
	for (var i=0, ilen=rows.length; i<ilen; i++) {
		var row = rows[i].replace( /^ +/, ''); // trim spaces only

		if (row.length == 0) {
			continue;
		}

		var matches = null;

		if (FIELD_OPENER.test(row)) {
			// is header row
			// get all fields into array
			matches = row.match(FIELD_BRACKETS);
			if (matches) {
				matches.splice(0, 0, 'header');
			}
		}
		else {
			// is data row
			var delimiter = row.substring(0, 1);
			row = row.substring(1); // ignore first delimiter
			// ignore if last character is delimiter
			if (row.charAt(row.length-1)==delimiter) {
				row = row.substring(0, row.length-1)
			}
			matches = row.split(delimiter);
			if (matches) {
				matches.splice(0, 0, 'data');
			}
		}

		if (matches) {
			vsvArray.push(matches);
		}
	}

	return vsvArray;
}

function Vsv2List(vsv) {
	if (typeof vsv == "string") {
		vsv = vsvRow2Array(vsv);
	}

	var list = document.createElement("dl");

	// parse by row
	for (var i=0, ilen=vsv.length; i<ilen; i++) {
		var row = vsv[i];
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into list
				for (var j=0, jlen=row.length; j<jlen; j++) {
					var header = row[j].replace(FIELD_BRACKETS, "$1");
					var dt = document.createElement("dt");
					var span = document.createElement("span");
					span.style.display = "inline-block";
					span.innerText = header;
					dt.appendChild(span);
					list.appendChild(dt);
				}
				break;
			case 'data':
				// is data row
				for (var j=0, jlen=row.length; j<jlen; j++ ) {
					var item = row[j];
					if (item.length > 0) {
						var dd = document.createElement("dd");
						dd.innerText = item; // ignore first delimiter
						list.appendChild(dd);
					}
				}
				break;
		}
	}

	return list;
}

function Vsv2Table(vsv) {
	if (typeof vsv == "string") {
		vsv = vsvRow2Array(vsv);
	}

	var table = document.createElement("table");

	// parse by row
	for (var i=0, ilen=vsv.length; i<ilen; i++) {
		var row = vsv[i];
		var rowType = row.shift();

		var tr = document.createElement("tr");
		table.appendChild(tr);

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into table
				for (var j=0, jlen=row.length; j<jlen; j++) {
					var header = row[j].replace(FIELD_BRACKETS, "$1");
					var th = document.createElement("th");
					tr.appendChild(th);
					th.innerText = header;
				}
				break;
			case 'data':
				// is data row
				// get all values into table
				for (var j=0, jlen=row.length; j<jlen; j++) {
					var data = row[j];
					var td = document.createElement("td");
					tr.appendChild(td);
					td.innerText = data;
				}
				break;
		}
	}

	return table;
}

function Vsv2XML(vsv) {
	if (typeof vsv == "string") {
		vsv = vsvRow2Array(vsv);
	}

	var xml = document.createElement("div");
	var stack = [xml];
	var currTag = xml, lastTag = xml;

	// parse by row
	for (var i=0, ilen=vsv.length; i<ilen; i++) {
		var row = vsv[i];
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into array
				for (var j=0, jlen=row.length; j<jlen; j++) {
					var tag = row[j].replace(FIELD_BRACKETS, "$1");

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
				}
				break;
			case 'data':
				// is data row
				var key = row[0], value = row[1];

				// attribute has key and value
				if (currTag) {
					if (value) {
						currTag.setAttribute(key, value);
					}
					else {
						currTag.appendChild(document.createTextNode(key));
					}
				}
				break;
		}
	}

	return xml;
}

function Vsv2JSON(vsv) {
	if (typeof vsv == "string") {
		vsv = vsvRow2Array(vsv);
	}

	var json = "";

	// parse by row
	for (var i=0, ilen=vsv.length; i<ilen; i++) {
		var row = vsv[i];
		var rowType = row.shift();

		switch (rowType) {
			case 'header':
				// is header row
				// get all fields into array
				for (var j=0, jlen=row.length; j<jlen; j++) {
					var field = row[j].replace(FIELD_BRACKETS, "$1");
					var bracketOpen = row[j].substring(0, 1);
					var bracketClose = row[j].substring(row[j].length-1);

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
				}
				break;
			case 'data':
				// is data row
				var key = row[0], value = row[1];
				// assign "key": "value"
				json += '"' + key + '": "' + value + '", ';
				break;
		}
	}

	// remove extra commas
	json = json.replace( /, *$/, "");

	// debug
	// test if valid JSON
	//var obj = JSON.parse(json);

	return json;
}

function parseVsvEls() {
	var vsvEls = document.querySelectorAll("[class^=vsv2]");

	for (var  i=0, ilen=vsvEls.length; i<ilen; i++) {
		var el = vsvEls[i];
		var text = el.innerText;
		var newEl = null;

		if (el.classList.contains("vsv2list")) {
			newEl = Vsv2List(text);
			newEl.className = "vsvlist";
		}
		else if (el.classList.contains("vsv2table")) {
			newEl = Vsv2Table(text);
			newEl.className = "vsvtable";
		}
		else if (el.classList.contains("vsv2xml")) {
			newEl = Vsv2XML(text);
			newEl.className = "vsvxml";
		}
		else if (el.classList.contains("vsv2json")) {
			var obj = Vsv2JSON(text);
			newEl = document.createElement("p");
			newEl.innerText = obj;
			newEl.className = "vsvjson";
		}

		if (newEl) {
			el.insertAdjacentElement('afterend', newEl);
		}
	}
}

window.addEventListener('load', parseVsvEls, false);

})(); // end script