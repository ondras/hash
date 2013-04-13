importScripts("md5-min.js", "sha1-min.js");

var createString = function(index, alphabet) {
	var len = alphabet.length;
	var result = "";
	while (index > -1) {
		result = alphabet.charAt(index % len) + result;
		index = Math.floor(index/len)-1;
	}
	return result;
}

var alphabet = "";
var hashes = {};
var func = null;

var message = function(e) {
	switch (e.data.type) {
		case "setup":
			alphabet = e.data.alphabet;
			hashes = e.data.hashes;
			switch (e.data.algo) {
				case "md5": func = hex_md5; break;
				case "sha1": func = hex_sha1; break;
				default: func = function(x) { return x; }; break;
			}
		break;
		
		case "work":
			var result = work(e.data.start, e.data.amount);
			postMessage(result);
		break;
	}
}

var work = function(start, amount) {
	var result = {hashes:{}};
	
	for (var i=0;i<amount;i++) {
		var index = start+i;
		var str = createString(index, alphabet);
		var hash = func(str);
		if (hash in hashes) { result.hashes[hash] = str; }
	}
	
	result.last = str;
	return result;
}

addEventListener("message", message);
