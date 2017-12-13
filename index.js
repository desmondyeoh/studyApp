var N_KEY = 110;
var STATES_DOMID = 'states';
var CANVAS_DOMID = 'big-canvas';
var STATES = {};

window.onload = main;


function NodeView(nodeId, position) {
	// DEFAULT VALUES
	var position = (position === undefined) ? [0,0] : position;
	var nodeId =  (nodeId === undefined) ? nextId() : nodeId;
	setStt("nodes/"+nodeId, this);

	this.view = document.createElement('textarea');
	this.view.style.position = "absolute";
	this.view.style.left = position[0] + 'px';
	this.view.style.top = position[1] + 'px';
	this.view.draggable = true;
	this.view.id = nodeId;
	this.view.style.minWidth = "50px";
	// this.view.style.minHeight = "50px";
	this.view.style.resize = "both";


	document.getElementById(CANVAS_DOMID).append(this.view);
	this.view.focus();


	function nextId() {
		var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
		var len = 10;
		var id = '';
		do {
			for (var i = 0; i < len; i++) {
				id += chars[Math.floor(Math.random() * chars.length)];
			}
		} while (id in getStt("nodes"));
		return id;
	}
}

function main() {
	// localStorage.clear();

	// SET INITIAL STATE
	setStt("nodes", {});
	setStt("mouseDown/targetId", null);
	setStt("mode", "idle");

	// LOAD FROM LOCAL STORAGE
	load();

	// AUTOSAVE
	setInterval(save, 1000);

	document.onkeypress = function(e) {
		// DEBUG
		setStt("event/key/lastKey", e.key);
	};

	document.ondblclick = function(e) {
		if (e.target.nodeName === "TEXTAREA") {
			var conf = confirm("You sure to delete this node "+e.target.id+"?\nContent: " + e.target.value);
			if (conf) {
				delStt("nodes/"+e.target.id);
				e.target.remove();
			}
			
		}
	}

	document.onclick = function(e) {
		// DEBUG
		setStt("event/click/pos/client", [e.clientX, e.clientY]);
		setStt("event/click/pos/page", [e.pageX, e.pageY]);
		setStt("event/click/pos/screen", [e.screenX, e.screenY]);
		setStt("event/click/target", e.target.nodeName);

		switch(e.target.nodeName) {
			case 'TEXTAREA':
				break;
			case 'BUTTON':
				break;
			default:
				// Create a node when mouse is left clicked.
				new NodeView(undefined, [e.pageX, e.pageY]);
		}
	};

	document.onmousedown = function(e) {
		if (e.target.nodeName === 'TEXTAREA') {
			var borderX1 = parseInt(e.target.style.left) + parseInt(e.target.style.width);
			var borderX2 = borderX1 - 20;
			var borderY1 = parseInt(e.target.style.top) + parseInt(e.target.style.height);
			var borderY2 = borderY1 - 20;
			setStt("mouseDown/targetId", e.target.id);
			setStt("mouseDown/bx1", borderX1);
			setStt("mouseDown/bx2", borderX2);
			setStt("mouseDown/by1", borderY1);
			setStt("mouseDown/by2", borderY2);
			setStt("mouseDown/client", [e.clientX, e.clientY]);


			if (e.clientX >= borderX2 &&
				e.clientY >= borderY2) {
				setStt("mode", "resize");
				setStt("resize/w0", e.target.style.width);
				setStt("resize/h0", e.target.style.height);
				e.target.style.width = 0;
				e.target.style.height = 0;
			} else {
				setStt("mode", "drag");
			}

			


			// e.target.style.width = 0;
			// e.target.style.height = 0;
		}
	}
	document.onmousemove = function (e) {
		// var targetId = getStt("mouseDown/targetId");
		// if (targetId) {
		// 	switch(getStt("mode")) {
		// 		case "resize":
		// 			target = document.getElementById(targetId);
		// 			// target.style.width = 0;
		// 			// target.style.height = 0;
		// 			target.style.width = e.clientX - target.style.left;
		// 			target.style.height = e.clientY - target.style.top;
		// 			break;
		// 	}
		// }
	}
	document.onmouseup = function(e) {
		if (getStt("mode") === "resize") {
			var w0 = getStt("resize/w0");
			var h0 = getStt("resize/h0");
			var nodeId = getStt("mouseDown/targetId");
			var w1 = document.getElementById(nodeId).style.width;
			var h1 = document.getElementById(nodeId).style.height;
			if (w0 !== w1 || h0 != h1){
				console.log("trigger textarea resize!");
			}
			setStt("mode", "idle");
			setStt("resize/w0", undefined);
			setStt("resize/h0", undefined);
			setStt("mouseDown/targetId", undefined);
		}
	}

	document.ondragstart = function(e) {
		var offX = e.clientX - parseInt(e.target.style.left, 10) ;
		var offY = e.clientY - parseInt(e.target.style.top, 10);

		setStt("drag/offX", offX);
		setStt("drag/offY", offY);
	}

	document.ondrag = function(e) {
		// DEBUG
		// setStt("drag/target", e.target);
		// setStt("drag/pos/client", [e.clientX, e.clientY]);
		// setStt("drag/pos/page", [e.pageX, e.pageY]);
		// setStt("drag/pos/screen", [e.screenX, e.screenY]);
	}

	document.ondragend = function(e) {
		// DEBUG
		setStt("mode", "idle");

		var x = e.pageX - getStt("drag/offX");
		var y = e.pageY - getStt("drag/offY");

		e.target.style.left = x + 'px';
		e.target.style.top = y + 'px';


	}

};

function save() {
	// save nodes: id, size, position, content
	var sttNodes = getStt("nodes");
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
	document.getElementById("message").innerHTML = "Saved " + now.getHours() + ":" + now.getMinutes();


}

function load() {
	var sttNodes = {};
	var jsonNodes = JSON.parse(localStorage.getItem("nodes"));

	// Clear Canvas VIEW
	document.getElementById(CANVAS_DOMID).innerHTML = "";

	for (var jsonNodeId in jsonNodes) {
		var jsonNode = jsonNodes[jsonNodeId];
		var sttNode = new NodeView(jsonNodeId);
		sttNode.view.style.width = jsonNode.size[0];
		sttNode.view.style.height = jsonNode.size[1];
		sttNode.view.style.left = jsonNode.position[0];
		sttNode.view.style.top = jsonNode.position[1];
		sttNode.view.value = jsonNode.content;
		sttNodes[jsonNodeId] = sttNode;
	}
	setStt("nodes", sttNodes);

}


function setStt(rawKey, val) {
	var keys = rawKey.split('/');

	var parent = STATES;
	for (var i = 0; i < keys.length - 1; i++) {
		parent[keys[i]] = parent[keys[i]] || {};
		parent = parent[keys[i]];
	}
	parent[keys[keys.length - 1]] = val
	dispStt();
}

function getStt(rawKey) {
	var keys = rawKey.split('/');

	var parent = STATES;
	for (var i = 0; i < keys.length - 1; i++) {
		assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]")
		parent = parent[keys[i]];
	}
	assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]")
	return parent[keys[i]]
}

function delStt(rawKey) {
	var keys = rawKey.split('/');

	var parent = STATES;
	for (var i = 0; i < keys.length - 1; i++) {
		assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]")
		parent = parent[keys[i]];
	}
	assert(keys[i] in parent, "Key Not Found in State: ["+keys[i]+"] in ["+rawKey+"]");
	delete parent[keys[i]];
	return true;
}

function dispStt() {
	var text = "STATES<br/>";
	var sortedKeys = Object.keys(STATES).sort();
	for (var i = 0; i < sortedKeys.length; i++) {
		text += sortedKeys[i] + ": " + JSON.stringify(STATES[sortedKeys[i]]) + "<br/>";
	}
	document.getElementById(STATES_DOMID).innerHTML = text + "\n\n" + JSON.stringify(localStorage);
	// document.getElementById(STATES_DOMID).innerHTML = JSON.stringify(STATES);
}

function assert(condition, message) {
	if (!condition) {
		throw message || "Assertion Error!";
	}
}
