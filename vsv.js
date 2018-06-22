/*
VSV = Versatile Separated Values
Interpret VSV markup into HTML tables and lists

Public Domain - Open standard - No royalty
//*/

(function() {

var FIELD_OPENER = /(\[\[|\(\(|\{\{|\<\<)/;
var FIELD_BRACKETS = /[\{\(\[\<]{2}(.*?)[\}\)\]\>]{2}/g;
var JSON_BRACKET = /^ *[\{\[]/;
var XML_BRACKET = /^ *[\<]/;
var XML_OPENER = '<';
var XML_CLOSER = '>';

function htmlEntitiesDecode(str) {
    return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}

function Vsv2Table(text) {
	var table = document.createElement("table");

	// parse by row
	var rows = text.split("\n");
	for (var i=0, ilen=rows.length; i<ilen; i++) {
		var row = rows[i].replace( /^ +/, ''); // trim spaces only

		if (FIELD_OPENER.test(row)) {
			// is header row
			var tr = document.createElement("tr");
			table.appendChild(tr);
			// get all fields into table
			var matches = row.match(FIELD_BRACKETS);
			if (matches) {
				for (var j=0, jlen=matches.length; j<jlen; j++) {
					var header = matches[j].replace(FIELD_BRACKETS, "$1");
					var th = document.createElement("th");
					tr.appendChild(th);
					th.innerText = header;
				}
			}
		}
		else {
			// is data row
			var delimiter = row.substring(0, 1);
			row = row.substring(1); // ignore first delimiter
			// check for optional delimiter at end
			if (row.lastIndexOf(delimiter)==row.length-1) {
				row = row.substring(0, row.length-1);
			}
			// get all values into table
			if (delimiter) {
				var matches = row.split(delimiter);
				var tr = document.createElement("tr");
				table.appendChild(tr);
				for (var j=0, jlen=matches.length; j<jlen; j++) {
					var data = matches[j];
					var td = document.createElement("td");
					tr.appendChild(td);
					td.innerText = data;
				}
			}
		}
	}
	return table;
}

function Vsv2List(text) {
	var list = document.createElement("dl");

	// parse by row
	var rows = text.split("\n");
	for (var i=0, ilen=rows.length; i<ilen; i++) {
		var row = rows[i].replace( /^ +/, ''); // trim spaces only

		if (FIELD_OPENER.test(row)) {
			// is header row
			var dt = document.createElement("dt");
			list.appendChild(dt);
			// get all fields into list
			var matches = row.match(FIELD_BRACKETS);
			if (matches) {
				for (var j=0, jlen=matches.length; j<jlen; j++) {
					var header = matches[j].replace(FIELD_BRACKETS, "$1");
					var span = document.createElement("span");
					span.style.display = "inline-block";
					span.innerText = header;
					dt.appendChild(span);
				}
			}
		}
		else {
			// is data row
			var item = row.substring(1).trim();
			if (item.length > 0) {
				var dd = document.createElement("dd");
				dd.innerText = item; // ignore first delimiter
				list.appendChild(dd);
			}
		}
	}

	return list;
}

function Vsv2JSON(text) {
	var json = "";

	// parse by row
	var rows = text.split("\n");
	for (var i=0, ilen=rows.length; i<ilen; i++) {
		var row = rows[i].replace( /^ +/, ''); // trim spaces only

		if (row.length == 0) {
			continue;
		}

		if (FIELD_OPENER.test(row)) {
			// is header row
			// get all fields into array
			var matches = row.match(FIELD_BRACKETS);
			if (matches) {
				for (var j=0, jlen=matches.length; j<jlen; j++) {
					var field = matches[j].replace(FIELD_BRACKETS, "$1");
					var bracketOpen = matches[j].substring(0, 1);
					var bracketClose = matches[j].substring(matches[j].length-1);

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
			}
		}
		else {
			// is data row
			var delimiter = row.substring(0, 1);
			row = row.substring(1); // ignore first delimiter
			row = row.split(delimiter);
			var key = row[0], value = row[1];
			// assign "key": "value"
			json += '"' + key + '": "' + value + '", ';
		}
	}

	// remove extra commas
	json = json.replace( /, *$/, "");

	// debug
	// test if valid JSON
	//var obj = JSON.parse(json);

	return json;
}

function Vsv2XML(text) {
	var xml = document.createElement("div");
	var stack = [];
	var currTag;

	// parse by row
	var rows = htmlEntitiesDecode(text).split("\n");
	for (var i=0, ilen=rows.length; i<ilen; i++) {
		var row = rows[i].replace( /^ +/, ''); // trim spaces only

		if (row.length == 0) {
			continue;
		}

		if (FIELD_OPENER.test(row)) {
			// is header row
			// get all fields into array
			var matches = row.match(FIELD_BRACKETS);
			if (matches) {
				for (var j=0, jlen=matches.length; j<jlen; j++) {
					var tag = matches[j].replace(FIELD_BRACKETS, "$1");

					// determine if opener or closer
					switch (tag) {
						case '/':
							currTag = stack.pop();
							break;
						default:
							currTag = document.createElement(tag);
							xml.appendChild(currTag);
							stack.push(currTag);
					}
				}
			}
		}
		else {
			// is data row
			var delimiter = row.substring(0, 1);
			row = row.substring(1); // ignore first delimiter
			row = row.split(delimiter);
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
		}
	}

	return xml;
}

function onloadVsv() {
	var vsvEls = document.querySelectorAll("[class^=vsv2]");

	for (var  i=0, len=vsvEls.length; i<len; i++) {
		var el = vsvEls[i];
		var text = el.innerText;
		var retval;

		if (el.classList.contains("vsv2table")) {
			retval = Vsv2Table(text);
			retval.className = "vsvtable";
		}
		else if (el.classList.contains("vsv2list")) {
			retval = Vsv2List(text);
			retval.className = "vsvlist";
		}
		else if (el.classList.contains("vsv2json")) {
			//if (JSON_BRACKET.test(text)) {
			var obj = Vsv2JSON(text);
			if (obj) {
				retval = document.createElement("p");
				retval.innerText = obj;
				retval.className = "vsvjson";
			}
			//}
		}
		else if (el.classList.contains("vsv2xml")) {
		//else if (XML_BRACKET.test(text)) {
			var obj = Vsv2XML(text);
			if (obj) {
				retval = obj;
				retval.className = "vsvxml";
			}
		}

		el.insertAdjacentElement('afterend', retval);
	}
}

window.addEventListener('load', onloadVsv, false);

})(); // end script