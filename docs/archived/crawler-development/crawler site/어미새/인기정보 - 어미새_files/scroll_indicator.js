(function () {
	if (this.init) return null;

	var wrapper = document.createElement("div");
	wrapper.id = "scroll_indicator-wrapper";
	wrapper.style.cssText = `
		width: 100%;
		height:3px;
		position:fixed;
		top:0;
		left:0;
		background:rgba(255, 255, 255, 0.0);
`;

	var indicator = document.createElement("div");
	indicator.id = "scroll_indicator-bar";
	indicator.style.cssText = `
		width:0;
		height: inherit;
		background: #ff7575;
`;

	wrapper.appendChild(indicator);
	document.body.appendChild(wrapper);

	window.addEventListener('scroll', indicateScrollBar);

	function indicateScrollBar(e) {
		var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
		var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		var scrolled = (winScroll / height) * 100;

		// const distanceFromPageTop = document.body.scrollTop || document.documentElement.scrollTop;
		// const height = document.body.scrollHeight - document.body.clientHeight;
		// const scrolled = (distanceFromPageTop / height) * 100;

		document.querySelector("#scroll_indicator-bar").style.width = `${scrolled}%`;
	}

	this.init = true;
})();

