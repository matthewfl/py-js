PY = {
	_copy: function (d) {
		function a () {};
		a.prototype = d;
		return new d;
	},
	_random: function () {
		var t = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_$";
		var ret = "";
		for(var a=15;a>0;a--) ret += t[Math.round(Math.random()*t.length)];
		return ret;
	},
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
		"print": function (t) {
			// TODO: make this like the real python print function
			alert(arguments[0]);
		},
		
		// system functions
		"PY___MakeFunction___": function (where, name, fun) {
			where[name] = fun;
		},
		"PY___PraseArgs___": function (args, data) {
			var a = [];
			for(var i=0;typeof args[i] != "undefined"; i++) a.push(args[i]);
			var ret = PY._copy(data.default);
			for(var i=0;i<a.length;i++) ret[data.num[i]] = a[i];
			for(var n in args) {
				if(PY._regex.exec(n) == null) {
					ret[n] = args[n];
				}
			}
			return ret;
		},
		"PY___BuildClass___": function(where, name, fun) {
			
		}
		//,"PY___Pass___": function () {}
	},
	_regex: {
		"indent": 		/([^\S]*)/
		,"preDef": 		/([a-z]+)/
		,"defFind":		/(def)\s+([A-Za-z][A-Za-z0-9]*)\s*\((.*)\):/
		,"varName":		/[a-zA-Z_][a-zA-Z0-9_]*/
		,"ifFind":		/if\s+([^:]+):/
		,"elifFind":	/elif\s+([^:]+):/
		,"ifReplace":	function (c) { return c.replace(/and/ig, "&&").replace(/or/ig, "||").replace(/\<\>/g, "!="); }
		,"whileFind":	/while\s+([^:]+):/
		,"forFind":		/for\s+([^]+?)\s+in\s+([^]+?):/
		,"notNum":		/[0-9]/
	},
	_preName: {
		"def": function (obj) {
			var d = PY._regex.defFind.exec(obj.code); // [all, "def", name, args]
			obj.code = "PY___MakeFunction___(this, \""+d[2].replace(/\"/g, "\"")+"\", function (PY___argsPassed___)";
			var argsList = d[4].split(",");
			
			obj.afterIndent = "var PY___argsPrased___ = PY___PraseArgs___(PY___argsPassed___, "+"'argsData'"+"); \n" // load the args
				+"with (PY___argsPrased___) {"; 
			obj.afterIndentClose = ")";
			obj.beforeIndentClose = "}";
		},
		"for": function (obj) {
			var d = PY._regex.forFind.exec(obj.code);
			var name = PY._random();
			obj.code = "for( "+name+" in "+d[2]+" )";
			obj.afterIndent = "var "+d[1]+" = "+d[2]+"["+name+"];";
		},
		"while": function (obj) {
			var d = PY._regex.whileFind.exec(obj.code);
			obj.code = "while( "+d[1]+" )";
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
			obj.code = "catch (PY___ERROR___)"
		},
		"pass": function (obj) {
			obj.code = "{}";
			obj.indent--;
			//obj.code = "PY___Pass___()";
		},
		"import": function (obj) {
			
		},
		"from": function (obj) {
		
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
        	if(PY._isJavascript !== false) {
        		if(PY._isJavascript > list[a].indent)
        			PY._isJavascript = false;
        		else
        			list[a].indent = PY._isJavascript;
        	}
        	if(name != null && PY._preName[name[1]] && PY._isJavascript === false) {
        		PY._preName[name[1]](list[a]);
        	}
        }
        var out = "";
        var indent = 0;
        var beforeIndentClose = [];
        var afterIndentClose = [];
        var afterIndentOpen = "";
        for(var a = 0;a<list.length;a++) {
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
        	afterIndentOpen = list[a].afterIndent;
        }
        beforeIndentClose = null;
        afterIndentClose = null;
        // clean up
        var o = "";
        while(o != out) { o = out; 
        out = out.replace(/\n\n/g, "\n").replace(/\}\n\}/g,"}}").replace(/\{\n\}/g, "{}").replace(/\{\n\{/g, "{{"); 
        }
        
        return out;
	},
	runCode: function (code) {
		var c = new Function ( "PY___RunEnv___", "var PY___IMPORT___ = {}; with(this) { with(PY___RunEnv___) { with(PY___IMPORT___) {\n"+ code + "\n}}}");
		var obj = {};
		try {
			c.call(obj, PY._functions);
		}catch(e) {
			alert(e);
		}
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