// interface
;(function (Py, _Py) {
		Py.run = function (code) {
				_Py.compile(code);
		};
})(Python, Python['.']);