var DEBUG_MODE = true;
var m = new Main()
window.onload = function() {m.main()};



/*************************************************************
* MAIN MODULE
*************************************************************/

function Main() {
	this.state = new State(cnst('domId/states'));
	this.ls = new LocalStorage(this.state, cnst('domId/canvas'));
}

Main.prototype.main = function() {
	// SET INITIAL STATE
	this.state.set("nodes", {});
	this.state.set("mouseDown/targetId", null);
	this.state.set("mode", "idle");

	// LOAD FROM LOCAL STORAGE
	this.ls.load();

	this.handleKeyPress = this.handleKeyPress.bind(this);
	this.handleClick = this.handleClick.bind(this);
	this.handleDblClick = this.handleDblClick.bind(this);
	this.handleMouseDown = this.handleMouseDown.bind(this);
	this.handleMouseUp = this.handleMouseUp.bind(this);
	this.handleDragStart = this.handleDragStart.bind(this);
	this.handleDragEnd = this.handleDragEnd.bind(this);

	document.onkeypress = this.handleKeyPress;
	document.onkeyup = this.ls.saveAfter(function(){});
	document.onclick = this.ls.saveAfter(this.handleClick);
	document.ondblclick = this.ls.saveAfter(this.handleDblClick);
	document.onmousedown = this.handleMouseDown;
	document.onmouseup = this.ls.saveAfter(this.handleMouseUp);
	document.ondragstart = this.handleDragStart;
	document.ondragend = this.ls.saveAfter(this.handleDragEnd);
}

Main.prototype.handleKeyPress = function(e) {
	if (DEBUG_MODE) {
		this.state.set("event/key/lastKey", e.key);
	}
};

Main.prototype.handleClick = function(e) {
	if (DEBUG_MODE) {
		this.state.set("event/click/pos/client", [e.clientX, e.clientY]);
		this.state.set("event/click/pos/page", [e.pageX, e.pageY]);
		this.state.set("event/click/pos/screen", [e.screenX, e.screenY]);
		this.state.set("event/click/target", e.target.nodeName);
	}

	switch(e.target.nodeName) {
		case 'TEXTAREA':
			break;
		case 'BUTTON':
			if (e.target.id === cnst("domId/clearBtn") &&
				prompt("Are you sure to clear the board? [Type: YES]") == "YES") {
				document.getElementById(cnst("domId/canvas")).innerHTML = "";
				this.state.set("nodes", {});
				this.ls.save();
			}
			break;
		default:
			// Create a node when mouse is left clicked.
			new NodeView(undefined, [e.pageX, e.pageY], this.state);
	}
};

Main.prototype.handleDblClick = function(e) {
	if (e.target.nodeName === "TEXTAREA") {
		var conf = confirm("You sure to delete this node "+e.target.id+"?\nContent: " + e.target.value);
		if (conf) {
			this.state.del("nodes/"+e.target.id);
			e.target.remove();
		}
		
	}
}

Main.prototype.handleMouseDown = function(e) {
	if (e.target.nodeName === 'TEXTAREA') {
		var borderX1 = parseInt(e.target.style.left) + parseInt(e.target.style.width);
		var borderX2 = borderX1 - 20;
		var borderY1 = parseInt(e.target.style.top) + parseInt(e.target.style.height);
		var borderY2 = borderY1 - 20;

		this.state.set("mouseDown/targetId", e.target.id);
		this.state.set("mouseDown/bx1", borderX1);
		this.state.set("mouseDown/bx2", borderX2);
		this.state.set("mouseDown/by1", borderY1);
		this.state.set("mouseDown/by2", borderY2);
		this.state.set("mouseDown/client", [e.clientX, e.clientY]);

		if (e.clientX >= borderX2 &&
			e.clientY >= borderY2) {
			this.state.set("mode", "resize");
			this.state.set("resize/w0", e.target.style.width);
			this.state.set("resize/h0", e.target.style.height);
			e.target.style.width = 0;
			e.target.style.height = 0;
		} else {
			this.state.set("mode", "drag");
		}
	}
}

Main.prototype.handleMouseUp = function(e) {
	if (this.state.get("mode") === "resize") {
		var w0 = state.get("resize/w0");
		var h0 = state.get("resize/h0");
		var nodeId = state.get("mouseDown/targetId");
		var w1 = document.getElementById(nodeId).style.width;
		var h1 = document.getElementById(nodeId).style.height;
		if (w0 !== w1 || h0 != h1){
			console.log("trigger textarea resize!");
		}
		this.state.set("mode", "idle");
		this.state.set("resize/w0", undefined);
		this.state.set("resize/h0", undefined);
		this.state.set("mouseDown/targetId", undefined);
	}
}


Main.prototype.handleDragStart = function(e) {
	var offX = e.clientX - parseInt(e.target.style.left, 10) ;
	var offY = e.clientY - parseInt(e.target.style.top, 10);

	this.state.set("drag/offX", offX);
	this.state.set("drag/offY", offY);
}

Main.prototype.handleDragEnd = function(e) {
	if (DEBUG_MODE) {
		this.state.set("mode", "idle");
	}

	var x = e.pageX - this.state.get("drag/offX");
	var y = e.pageY - this.state.get("drag/offY");

	e.target.style.left = x + 'px';
	e.target.style.top = y + 'px';
}


/*************************************************************
* NODE VIEW MODULE
*************************************************************/

function NodeView(nodeId, position, state) {
	var position = (position === undefined) ? [0,0] : position;
	var nodeId =  (nodeId === undefined) ? nextId() : nodeId;
	assert(state !== undefined, "No [state] passed to NodeView");
	state.set("nodes/"+nodeId, this);

	this.view = document.createElement('textarea');
	this.view.style.position = "absolute";
	this.view.style.left = position[0] + 'px';
	this.view.style.top = position[1] + 'px';
	this.view.draggable = true;
	this.view.id = nodeId;
	this.view.style.minWidth = "50px";
	this.view.style.resize = "both";


	document.getElementById(cnst('domId/canvas')).append(this.view);
	this.view.focus();


	function nextId() {
		var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var len = 10;
		var id = '';
		do {
			for (var i = 0; i < len; i++) {
				id += chars[Math.floor(Math.random() * chars.length)];
			}
		} while (id in state.get("nodes"));
		return id;
	}
}


/*************************************************************
* LOCAL STORAGE MODULE
*************************************************************/

function LocalStorage(state, domId) {
	this.state = state;
	this.DOM_ID = domId;
}

LocalStorage.prototype.save = function() {
	// save nodes: id, size, position, content
	var sttNodes = this.state.get("nodes");
	var jsonNodes = {};

	for (var sttNodeId in sttNodes) {
		var sttNode = sttNodes[sttNodeId];
		var jsonNode = {}
		jsonNode.size = [sttNode.view.style.width, sttNode.view.style.height];
		jsonNode.position = [sttNode.view.style.left, sttNode.view.style.top];
		jsonNode.content = sttNode.view.value;
		jsonNodes[sttNodeId] = jsonNode;
	}

	localStorage.setItem("nodes", JSON.stringify(jsonNodes));

	var now = new Date();
	document.getElementById("message").innerHTML = "Saved to localStorage!";
	setTimeout(function(){
		document.getElementById("message").innerHTML = "";
	},500);

}

LocalStorage.prototype.saveAfter = function(f) {
	var ls = this;
	function wrap() {
		f.apply(null, arguments);
		ls.save();
	}
	return wrap;
	
}

LocalStorage.prototype.load = function() {
	var sttNodes = {};
	var jsonNodes = JSON.parse(localStorage.getItem("nodes"));

	// Clear Canvas VIEW
	document.getElementById(this.DOM_ID).innerHTML = "";

	for (var jsonNodeId in jsonNodes) {
		var jsonNode = jsonNodes[jsonNodeId];
		var sttNode = new NodeView(jsonNodeId, undefined, this.state);
		sttNode.view.style.width = jsonNode.size[0];
		sttNode.view.style.height = jsonNode.size[1];
		sttNode.view.style.left = jsonNode.position[0];
		sttNode.view.style.top = jsonNode.position[1];
		sttNode.view.value = jsonNode.content;
		sttNodes[jsonNodeId] = sttNode;
	}
	this.state.set("nodes", sttNodes);

}


/*************************************************************
* STATE MODULE
*************************************************************/

function State(domId) {
	this.STATES = {};
	this.DOM_ID = domId;
}

State.prototype.set = function(rawKey, val) {
	var keys = rawKey.split('/');
	var parent = this.STATES;
	for (var i = 0; i < keys.length - 1; i++) {
		parent[keys[i]] = parent[keys[i]] || {};
		parent = parent[keys[i]];
	}
	parent[keys[keys.length - 1]] = val
	this.display();
}

State.prototype.get = function(rawKey) {
	var keys = rawKey.split('/');

	var parent = this.STATES;
	for (var i = 0; i < keys.length - 1; i++) {
		assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]")
		parent = parent[keys[i]];
	}
	assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]")
	return parent[keys[i]];
}

State.prototype.del = function(rawKey) {
	var keys = rawKey.split('/');

	var parent = this.STATES;
	for (var i = 0; i < keys.length - 1; i++) {
		assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]")
		parent = parent[keys[i]];
	}
	assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]");
	delete parent[keys[i]];
	return true;
}

State.prototype.display = function() {
	var text = "STATES<br/>";
	var sortedKeys = Object.keys(this.STATES).sort();
	for (var i = 0; i < sortedKeys.length; i++) {
		text += sortedKeys[i] + ": " + JSON.stringify(this.STATES[sortedKeys[i]]) + "<br/>";
	}
	document.getElementById(this.DOM_ID).innerHTML = text + "\n\n" + JSON.stringify(localStorage);
}


/*************************************************************
* CUSTOM BUILT-IN HELPER FUNCTIONS
*************************************************************/

function assert(condition, message) {
	if (!condition) {
		throw message || "Assertion Error!";
	}
}

function cnst(key) {
	var constants = {
		'domId/canvas': 'canvas',
		'domId/states': 'states',
		'domId/clearBtn': 'clearBtn',
	}
	assert(key in constants, "["+key+"] is not in constants.");
	return constants[key];
}