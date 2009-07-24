Python = {
    _Debug: true,
    print: function (p) {Python._.debug("Print from code, replace Python.print to get the print statments or set print in the scrips enverment\nPrinted Statment:\n\n"+p);},
    _: {
        env: { // the stander enverment for all Python scrips
            str: function (s) {
                return s + "";
            },
            int: function (i) {
                i = (i+"").replace(/[^0-9\.]/g, "");
                return Math.floor(i*1);
            },
            double: function (d) {
                d = (d+"").replace(/[^0-9\.]/g, "");
                return d*1.0;
            },
            print: function () {
                var t = "";
                for(var a = 0;a<arguments.length;a++) {
                    t+=(t == "" ? "" : "\t") + arguments[a];
                }
                Python.print(t);
            },
            
            
            ___class___: function () { // a private function for building the classes
                var out = {};
                var fun = {};
                function PyClass () {
                    if(typeof this.__init__ == "function") { 
                        var arg = Python._.array(arguments);
                        arg.shift(this);
                        this.__init__.apply(this, arg);
                    }
                }
                for(var a = 0; a< arguments.length;a++) {
                    for(var name in arguments[a]) {
                        if(typeof arguments[a][name] == "function") {
                            (function (n,f) {
                                fun[n] = function () {
                                    if(!this[n]) throw new Python.error("function was was not found");
                                    var arg = Python._.array(arguments);
                                    arg.shift(
                                    this[n].apply(this
                                };
                            })(name,arguments[a][name]);
                        }else
                            out[name] = arguments[a][name];
                    }
                }
                Python._.add(PyClass,fun);
                PyClass.prototype = out;
                PyClass.constructor = PyClass;
                return PyClass;
            }
        },
        add: function (a,b,overide) {
            for(var c in b) {
                if(!a[c] || overide == true) 
                    a[c] = b[c];
            }
            return a;
        },
        callCount: function (times, callback) {
            return (function (time,call) {
                return function () {
                    if(time <= 0)
                        call.call(arguments);
                    else
                        time--;
                };
            })(times,callback);
        },
        wrapFunction: function () {
            function f() {return this.callTo.call(arguments);};
            f.prototype.callTo = function () {};
            return f;
        },
        copy: function (o) {
            function f() {};
            f.prototype = o;
            return new f();
        },
        debug: function (t) {
            if(console.debug && Python._Debug == true)
                console.debug("JsPython:\n"+t);
            return t;
        },
        array: function (a) {
            var ar = new Array();
            for(var b = 0;b<a.length;b++) {
                ar.push(a[b]);
            }
            return ar;
        }
    },
    include: function () {
        this.obj = {};
        this.waitingObj = {};
        this.MakeObj = function (name, text) {
            var g = this.compile(text);
            (function (g,n) {
                this.build(g[0], function () {
                    var a = {};
                    this.
                    this.obj[n]
                });
            })(g,name);
        };
        this.loadInObj = function (name) {
            this.loadFile(name, function (text) {
                if(!this.waitingObj[name] || this.waitingObj[name].length == 0) return;
                for(var a = 0;a<this.waitingObj[name].length;a++) {
                    this.waitingObj[name][a]();
                }
            });
        };
        this.getObj = function (name,callback) {
            callback = callback || new Function ();
            if(this.obj[name]) {
                callback(this.obj[name]);
                return;
            }
            if(!this.waitingObj[name])
                this.waitingObj[name] = [];
            this.waitingObj[name].push(callback);
            this.loadInObj(name);
        };
        this.loadFile = function (name,callback) {
            throw Python._.debug("include.loadFile should be replaced with a function that will load the file and take a name and a callback\nfor Loading file:"+name);
        };
        this.build = function (list,callback) {
            callback = callback || function () {};
            if(list.length == 0) return callback({});
            var _r = {};
            var _s = 0;
            (function (ret,size) {
                for(var a = 0;a<list.length;a++) {
                    this.getObj(list[a], function (o) {
                        size++;
                        Python._.add(ret,o);
                        if(size >= list.length) callback(ret);
                    });
                }
            })(_r,_s);
        };
    },
    env: function (include) {
        this.include = include || new Python.include();
        this.run = function (code) {
            this.exe(Python.compile(code));
        };
        
        this.exe = function (ex,global) {
            global = global || {};
            this.include.build(ex[0], function (w) {
                Python._.add(w,global);
                Python._.add(w,Python._.env);
                Python._.debug(ex[1].toSource());
                ex[1].apply(w);
            });
        };
    },
    
    compile: function (code, global) {
        global = global || {};
        // take care of comments and """ quotes
        code = code.replace(/#.+/g,"\n");
        var code_split = code.split("\"\"\"");
        code = "";
        for(var a = 0;a<code_split.length;a++) {
            if(a%2 == 0) {
                code+=code_split[a];
            }else{
                code += "str(\""+code_split[a].replace(/\"/g, "\\\"").replace(/\n/g, "\\n").replace(/\r/g, "\\r")+"\")\n";
            }
        }
        
        var imports = ""; // all of the import statment should be in this string seprated by a "\n"
        code = code.split("\n");
        
        function buildTree (line,indents) {
            
        }
        
        buildTree(0,0);
        
        return [imports,new Function ('with(this) {' +code.join("\n")+ '}')];
    },
    run: function (code) {
        Python._.debug(code);
        var Env = new Python.env();
        Env.run(code);
        return Env;
    },
    error: function (e,n) {
        this.message = e;
        this.name = n || "JsPython";
    }
};