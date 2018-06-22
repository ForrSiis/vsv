/*
VSV = Versatile Separated Values
Interpret VSV markup into HTML tables and lists

Public Domain - Open standard - No royalty
//*/

(function() {

var FIELD_OPENER = /(\[\[|\(\(|\{\{|\<\<)/;
var FIELD_BRACKETS = /[\{\(\[]{2}(.*?)[\}\)\]]{2}/g;

function renderVsvText(text) {
	var table = document.createElement("table");
	table.className = "vsvtable";

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

function renderVsvEl(el) {
	var table = renderVsvText(el.innerText);
	return table;
}

function onloadVsv() {
	var vsvEls = document.getElementsByClassName("vsv");

	for (var  i=0, len=vsvEls.length; i<len; i++) {
		var el = vsvEls[i];
		el.style.display = "none";
		el.style.visibility = "hidden";

		var table = renderVsvEl(el);
		el.parentElement.insertBefore(table, el);
	}
}

window.addEventListener('load', onloadVsv, false);

})(); // end script