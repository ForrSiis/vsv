
(function() {

	function parseVsvEls() {
		Array.prototype.forEach.call(document.querySelectorAll("[class^=vsv2]"), function (el) {
			var text = el.innerText;
			var formatType = el.className.match( /vsv2([^ ]+)/ )[1];

			if (VSV.mapTo[formatType]) {
				var newEl = VSV.mapTo[formatType](text);

				switch (formatType) {
					case 'json':
					case 'von':
						var obj = newEl;
						newEl = document.createElement("p");
						newEl.innerText = (formatType == "json") ? obj : JSON.stringify(obj, null, "   ");
						break;
					case 'list':
					case 'table':
					case 'xml':
					case 'vml':
					case 'default':
				}

				newEl.className = "vsv" + formatType;
				(newEl) ? el.insertAdjacentElement('afterend', newEl) : null;
			}
		});
	}

	window.addEventListener('load', parseVsvEls, false);
})();