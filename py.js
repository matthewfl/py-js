/*
  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Lesser General Public License as published by
  the Free Software Foundation, version 3.
  
  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Lesser General Public License for more details.
  
  You should have received a copy of the GNU Lesser General Public License
  along with this program.  If not, see <http://www.gnu.org/licenses/>.
  
  Created by: Matthew Francis-Landau <matthew@matthewfl.com>
  http://github.com/matthewfl/py-js/
*/


PY = {
    log: console.log || function () {},
    const: {
	CLASS_NO_INIT: 1+Math.random(),
	RAND_PRE: ""
    },
    _copy: function (d) {
	var a = function () {};//function a () {};
	a.prototype = d || {};
	return new a;
    },
    _random: function () {
	var t = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM_$";
	var ret = PY.const.RAND_PRE;
	for(var a=15;a>0;a--) ret += t[Math.round(Math.random()*t.length)];
	return ret;
    },
    _files: {},
    _functions: {
	// normal python functions
	"str": function (a) {
	    return a[0].toString();
	},
	"int": function (n) {
	    return n[0]*1;
	},
	"len": function (w) {
	    return w[0].length;
	},
	"print": function (t) {
	    // TODO: make this like the real python print function
	    alert(t[0]);
	},
	// system functions
	"PY___MakeFunction___": function (where, name, fun) {
	    where[name] = fun;
	},
	"PY___PraseArgs___": function (args, data) {
	    var a = [];
	    args = args || {};
	    for(var i=0;typeof args[i] != "undefined"; i++) a.push(args[i]);
	    var ret = PY._copy(data.default);
	    for(var i=0;i<a.length;i++) ret[data.num[i]] = a[i];
	    for(var n in args) {
		if(PY._regex.notNum.exec(n))
		    ret[n] = args[n];
	    }
	    for(var n in ret)
		if(ret[n] == data.default[n])
		    ret[n] = eval(ret[n]); // need to check this for function calling
	    return ret;
	},
	"PY___ClassBase___": function (loc, name, of) {
	    function push_args (args, push) {
		// move all the args down one
		var i=-1;
		while(typeof args[i++] != "undefined");
		for(;i>=0;--i) {
		    args[i+1] = args[i];
		}
		args[0]=push;
		return args;
	    }
	    var self = loc[name] =  function (_args) {
		var ret=PY._copy();
		for(var name in self)
		    if(typeof self[name] == "function")
			ret[name] = (function (f) {
				return function (args,ret) {
				    push_args(args,ret);
				    f(args);
				};
			    })(self[name],ret);
		if(typeof ret.__init__ == "function")
		    ret.__init__(push_args(_args, ret));
		return ret;
	    };
	    return self;
	},
	"PY___CheckVarName___": function (context, name) {
	    for(var a=0;a<context.length;++a)
		if(typeof context[a][name] != "undefined")
		    return;
	    log("making var name "+name);
	    context[0][name] = null;
	}
    },
    _regex: {
	     "indent":      /([^\S]*)/
	    ,"preDef":      /([a-z]+)/
	    ,"defFind":     /(def)\s+([A-Za-z_][A-Za-z0-9_]*)\s*@\(@(.*)@\)@:/
	    ,"classFind":   /(class)\s+([A-Za-z_][A-Za-z0-9_]*)([^:]*):/
	    ,"varName":     /[a-zA-Z_][a-zA-Z0-9_]*/
	    ,"ifFind":      /if\s+([^:]+):/
	    ,"elifFind":    /elif\s+([^:]+):/
	    ,"ifReplace":   function (c) { return c.replace(/and/ig, "&&").replace(/or/ig, "||").replace(/\<\>/g, "!="); }
	    ,"whileFind":   /while\s+([^:]+):/
	    ,"forFind":     /for\s+([^]+?)\s+in\s+([^]+?):/
	    ,"notNum":      /[^0-9]/
	    ,"trimNoSpace":	/\s*([^\s]+)\s*/
	    ,"trim":	function (c) { return c.replace(/^\s+/, ""); }
	//,"defCallFind":	/\(([
    },
    _argCallBuild: function (code) { // should get the code between ()
	// build the set up for calling py functions
	/*var check = code.split("@(@"); /////////////////////////////////////// fix this
		if(check.length > 1) {
			var o = check.pop();
			return check.join("@(@")+"("+PY._argCallBuild(o.split("@)@")[0])+")";
		}*/
	var ret = {};
	var c = code.split(",");
	for(var a=0;a<c.length;a++) {
	    var w = c[a];
	    if(w.indexOf("=")==-1) {
		if(w)
		    ret[a] = w;
	    }else{
		var s = w.split("=");
		ret[PY._regex.trimNoSpace.exec(s[0])[1]] = s[1];
	    }
	}
	var out = "{ ";
	for(var a in ret)
	    out += "\""+a+"\":"+ret[a]+" ,";
	out = out.replace(/\"([0-9]+)\"/g, "$1");
	return out.substring(0,out.length-1)+"}";
    },
    _preName: {
	"def": function (obj) {
	    var trim = PY._regex.trim;
	    var d = PY._regex.defFind.exec(obj.code); // [all, "def", name, args]
	    obj.code = "PY___MakeFunction___(PY___CONTEXT___[0], \""+d[2]+"\", function (PY___argsPassed___)";
	    var argsList, argsData={num:[], default:{}};
	    if(d[3] && d[3] != "") {
		argsList = d[3].split(",");
		for(var a=0;a<argsList.length;a++) {
		    argsData.num[a] = trim(argsList[a].split("=")[0]);
		    if(argsList[a].indexOf("=")!=-1) {
			var i = argsList[a].split("=");
			i[0] = trim(i[0]);
			i[1] = trim(i[1]);
			argsData.default[i[0]] = i[1];
		    }
		}
	    }
	    obj.afterIndent = "PY___CONTEXT___.unshift(this);"
	    +"var PY___argsPrased___ = PY___PraseArgs___(PY___argsPassed___, "+JSON.stringify(argsData)+"); \n" // load the args
	    +"with (PY___argsPrased___) {"; 
	    obj.afterIndentClose = ");";
	    obj.beforeIndentClose = "} PY___CONTEXT___.shift();";
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
	"class": function (obj) { ////////////////////////////////////////////////////////////////// not done
	    var d = PY._regex.classFind.exec(obj.code); // [all, "class", name, other]
	    obj.code = "PY___CONTEXT___.unshift(PY___ClassBase___(PY___CONTEXT___[0], \""+d[2]+"\", null));";
	    obj.afterIndent = "";
	    if(/[^\S]/.exec(d[2])) {
		obj.afterIndent += "\n"+d[2].split
	    }
	    obj.beforeIndentClose = ";PY___CONTEXT___.shift();"
	    obj.afterIndentClose = "";
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
	    //obj.indent--;
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
	
        var code_split = code.split("\"\"\"");
        code = "";
        for(var a = 0;a<code_split.length;a++) {
            if(a%2 == 0) {
            	var c = code_split[a];
            	c = c.replace(/#.+/g,"\n").replace(/\/\/.+/g, "\n").replace(/(\(|\))/g, "@$1@");
                code+=c;
            }else{
                code += "str(\""+code_split[a].replace(/\"/g, "\\\"").replace(/\n\s*/g, "\\n").replace(/\r/g, "\\r").replace(/\'/g, "\\\'")+"\")\n";
            }
        }
        //code = code.replace(PY._regex.oneLineP, PY._regex.oneLinePF);
        code_split = code.split("\n");
        code = null;
	var indent_stack = [""];
        var list = [{"code": "", "indent":0}];
        for(var a = 0;a<code_split.length;a++) {
            var indent = PY._regex.indent.exec(code_split[a])[0];
	    while(indent != indent_stack[indent_stack.length-1]) { // fix this // indent_stack[indent_stack.length-1]
		if(indent.length > indent_stack[indent_stack.length-1].length)
		    indent_stack.push(indent);
		else if(indent.length < indent_stack[indent_stack.length-1].length)
		    indent_stack.pop();
	    }
	    indent = indent_stack.length-1;
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
        	else {
        	    list[a].indent = PY._isJavascript;
        	    list[a].code = list[a].code.replace(/@(\(|\))@/g, "$1");
        	}
            }
            if(name != null && PY._preName[name[1]] && PY._isJavascript === false) {
        	PY._preName[name[1]](list[a]);
            }else if(PY._isJavascript === false) {
        	
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
        	    out += "\n{\n" + afterIndentOpen +"\n"+ list[a].code+"\n";
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
        var o = "";
        while(o != out) { 
	    o = out;
	    ///////////////////////////////////////////////////////////////////////////
            // fix function calls
	    // TODO: make this better
	    //out = out.replace(/@\(@([^]*)@\)\@/g, PY._argCallBuild);
	    var d = out.split("@(@");
	    out = "";
	    for(var a=0;a<d.length;a++) {
	        if(d[a].count("@)@")==1) {
	            out += '('+PY._argCallBuild(d[a].substring(0,d[a].indexOf("@)@"))) + ')' + d[a].substring(d[a].indexOf("@)@")+3);
	        }
		else
		    out += d[a];
	    }
	}
        o="";
        while(o != out && false) { // fix this line
	    o = out; 
	    // clean up
	    out = out.replace(/([\{\[\(\)\]\};])[\n\s]+([\{\[\(\)\]\};])/g, "$1$2")
		.replace(/\n+/g, "\n")
		.replace(/([;\{\}]);/g, "$1")
		.replace(/([\{\};])[\n\s]+/g, "$1");
        }
        
        return [out, []]; // ["code", ["import", "list"]]

    },
    loadCode: function (name, code) {
	PY._files[name] = new Function ("PY___RunEnv___", "var PY___IMPORT___ = {}; var PY___CONTEXT___ = [this]; with(PY._functions) { with(PY___RunEnv___) { with(PY___IMPORT___) { with(this) {\n"+ code[0] + "\n}}}}");
	//console.log(code[0].split("\n"));
    },
    runCode: function (name) {
	try {
	    return new PY._files[name]({"__name__": name});
	}catch(e) {
	    PY.log(e);
	    alert(e.message);
	}
    },
    packer: {
	chars: "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm",
	base: function (n) {
	    var ret="",c=PY.packer.chars;
	    while(n!=0) {
		var place = n%c.length;
		n-=place;
		n/=c.length;
		ret+=c[place];
	    }
	    return ret;
	},
	data: {},
	out: [],
	num: 1,
	rest: function () {
	    PY.packer.data={};
	    PY.packer.out=[];
	    PY.packer.num=1;
	},
	compress: function (code) {
	    code = code.replace(/([a-zA-Z0-9_$]+)/g, function (a,b) {
		if(PY.packer.data[b])
		    return PY.packer.data[b];
		else {
		    var t = PY.packer.base(PY.packer.num++);
		    PY.packer.out.push(b);
		    PY.packer.data[b] = t;
		    return t;
		}
	    });
	    return code;
	},
	unCompress: function (da) {
	    var a = da.split('|');
	    return function (s) {
		for(var num=0;num<a.length;num++) {
		    s=s.replace(PY.packer.base(num+1), a[num], 'g');
		}
		return s;
	    }
	}
    },
    _CompBuilder: function (c) {
	var import={}; // true: loaded, false: need loading
	var comp={};
	for(var name in c) {
	    import[name]=true;
	    comp[name]=PY.packer.compress(c[name][0]);
	    for(var a=0;a<c[name][1].length;a++) {
		if(import[c[name][1][a]] !== true)
		    import[c[name][1][a]] = false;
	    }
	}
	var i=[];
	for(var name in import) {
	    if(import[name] !== true)
		i.push(name);
	}
	return "Py._CompLoader( " + JSON.stringify([PY.packer.out.join('|'), i, comp]) + " );";
    },
    _CompLoader: function (code) {
	var unPack = PY.packer.unCompress(code[0]);
	var import = code[1];
	for(var a=0;a<import.length;a++) {
	    // import[a]
	}
	code = code[2];
	for(var n in code) {
	    PY.loadCode(n, unPack(code[n][0]));
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

// init code
PY.const.RAND_PRE = "PY_$_"+PY._random().substring(8);