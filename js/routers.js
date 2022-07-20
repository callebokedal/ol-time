routie({
	'': function() {
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
	'*': function() {
		console.log("Default route: ", document.location.hash);
	}
});