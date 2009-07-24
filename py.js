PY = {
	_files: {},
	_functions: {
		// normal python functions
		"str": function (a) {
			return a.toString();
		},
		"int": function (n) {
			return n*1;
		},
		"len": function (w) {
			return w.length;
		},
		
		// system functions
		"PY___MakeFunction___": function (where, name, fun) {
			
		}
		//,"PY___Pass___": function () {}
	},
	_regex: {
		"indent": 		/([^\S]*)/
		,"preDef": 		/([a-z]+)/
		,"defFind":		/(def)\s+([A-Za-z][A-Za-z0-9]+)\s*\((.*)\):/
		,"ifFind":		/if\s+([^:]+):/
		,"elifFind":		/elif\s+([^:]+):/
		,"ifReplace":		function (c) { return c.replace(/and/ig, "&&").replace(/or/ig, "||").replace(/\<\>/g, "!="); }
	},
	_preName: {
		"def": function (obj) {
			var d = PY._regex.defFind.exec(obj.code); // [all, "def", name, args]
			obj.code = "PY___MakeFunction___(this, \""+d[2].replace(/\"/g, "\"")+"\", function (PY___argsPassed___)";
			obj.afterIndent = "var PY___argsPrased___ = PY___PraseArgs___(PY___argsPassed___, "+"'argsData'"+"); \n" // load the args
				+"with (PY___argsPrased___) {"; 
			obj.afterIndentClose = ")";
			obj.beforeIndentClose = "}";
		},
		"for": function (obj) {
		},
		"while": function (obj) {
		},
		"class": function (obj) {
		},
		"if": function (obj) {
			var d = PY._regex.ifFind.exec(obj.code);
			var c = PY._regex.ifReplace(d[1]);
			obj.code = "if( "+c+" )";
		},
		"elif": function (obj) {
			var d = PY._regex.elifFind.exec(obj.code);
			var c = PY._regex.ifReplace(d[1]);
			obj.code = "else if( "+c+" )";
		},
		"else": function (obj) {
			obj.code = "else";
		},
		"try": function (obj) {
			obj.code = "try";
		},
		"except": function (obj) {
		},
		"pass": function (obj) {
			obj.code = "{}";
			obj.indent--;
			//obj.code = "PY___Pass___()";
		},
		"js": function (obj) { // run some javascript code
			obj.code = "(function () ";
			obj.afterIndentClose = ")()";
			PY._isJavascript = obj.indent+1;
		}
	},
	_isJavascript: false,
	// locate a file and pass it to the callback
	_get: function (file, callback) {
		//using jQuery
		$.get(file, callback);
	},
	compile: function (code) {
		code = code.replace(/#.+/g,"\n");
		code = code.replace(/\/\/.+/g, "\n");
        var code_split = code.split("\"\"\"");
        code = "";
        for(var a = 0;a<code_split.length;a++) {
            if(a%2 == 0) {
                code+=code_split[a];
            }else{
                code += "str(\""+code_split[a].replace(/\"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\'/g, "\\\'")+"\")\n";
            }
        }
        //code = code.replace(PY._regex.oneLineP, PY._regex.oneLinePF);
        code_split = code.split("\n");
        code = null;
        var list = [{"code": "", "indent":0}];
        for(var a = 0;a<code_split.length;a++) {
        	var indent = PY._regex.indent.exec(code_split[a])[0].length;
        	var c = code_split[a].substring(indent)
        	if(c && c != "") {
	        	while(c.count("(") != c.count(")")) {
	        		a++;
	        		var o = code_split[a];
	        		o = o.substring(PY._regex.indent.exec(o)[0].length);
	        		c += o;
	        	}
	        	list.push({
	        		"code": c,
	        		"indent":indent,
	        		"afterIndent":"",
	        		"beforeIndentClose": "",
	        		"afterIndentClose": ""
	        	});
        	}
        }
        list.push({"code": "", "indent":0});
        code_split = null;
        for(var a = 0;a<list.length;a++) {
        	var name = PY._regex.preDef.exec(list[a].code);
        	if(name != null) {
	        	if(PY._preName[name[1]] && (PY._isJavascript === false || list[a].indent < PY._isJavascript)) {
	        		//list[a].indent++;
	        		PY._isJavascript = false;
	        		PY._preName[name[1]](list[a]);
	        	}else if(PY._isJavascript !== false) {
	        		list[a].indent = PY._isJavascript;
	        	}
        	}
        }
        var out = "";
        var indent = 0;
        var beforeIndentClose = [];
        var afterIndentClose = [];
        var afterIndentOpen = "";
        for(var a = 0;a<list.length;a++) {
        	afterIndentOpen = list[a].afterIndent;
        	if(list[a].indent != indent) {
        		if(list[a].indent > indent) {
	        		beforeIndentClose.push(list[a-1].beforeIndentClose);
	        		afterIndentClose.push(list[a-1].afterIndentClose);
        			out += "\n{\n" + afterIndentOpen +"\n"+ list[a].code;
        			indent = list[a].indent;
        		}else{
        			while(indent > list[a].indent) {
        				indent--;
        				out += beforeIndentClose.pop() + "\n}\n" + afterIndentClose.pop() + "\n";
        			}
        			out += list[a].code +"\n";
        		}
        	}else
        		out += list[a].code+"\n";
        }
        beforeIndentClose = null;
        afterIndentClose = null;
        // clean up
        var o = "";
        while(o != out) { o = out; 
        out = out.replace(/\n\n/g, "\n").replace(/\}\n\}/g,"}}").replace(/\{\n\}/g, "{}").replace(/\{\n\{/g, "{{"); 
        }
        
        return out;
	}
};

String.prototype.count = function (what) {
	var c=0,a=0;
	while(1) {
		a = this.indexOf(what, a)+1;
		if(a == 0) break;
		c++;
	}
	return c;
};