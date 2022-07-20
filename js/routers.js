routie({
	'': () => {
		console.log("start");

		renderTemplate('tpl_form', '#main', forms);
		renderTemplate('tpl_result', '#result', {});

		if(settingsExists()) {
			let data = loadSettings();
			console.debug("Settings loaded", data);
			populateValues(data);
		}

		calculateResult();

		// Init all popovers
		var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'))
		var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
			return new bootstrap.Popover(popoverTriggerEl)
		});

		// Update result on any change
		document.getElementById("timeForm").addEventListener("change", (event) => { calculateResult();}, false);
	},
	's/:data': (data) => {
		// Load (s)hared data
		//console.log("Load shared data: ", document.location.hash, data);
		data = parseSharedData(data);

		renderTemplate('tpl_form', '#main', forms);
		renderTemplate('tpl_result', '#result', {});
		populateValues(data);
		console.log("Imported and populated data", data);
		calculateResult();
		//document.location = "#";
		// Go to start
		routie("");
	},
	'*': () => {
		console.log("Default route: ", document.location.hash);
		routie("");
	}
});