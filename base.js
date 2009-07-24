var Python = {
		".": { // private
				loaded: {},
				waitingLoad: {},
				debug: function (t) {
						if(console.debug)
								console.debug("JsPython:\n"+t);
				}
		},
		baseLoadPath: "./",
};