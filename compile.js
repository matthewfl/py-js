// compile
;(function (Py) {
		Py.compile = function (code) {
				code = code.replace("\/\/[^\n]+", "");
				Py.debug(code);
		};
})(Python['.']);