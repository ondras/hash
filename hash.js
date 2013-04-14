var App = function() {
	this._workers = [];
	this._workerCount = 0;
	this._alphabet = "";
	this._work = 0;
	this._hashes = {};
	this._interval = 0;
	this._algo = "";
	
	this._stats = {
		start: 0,
		last: "",
		currentTS: 0,
		currentWork: 0
	}
	
	this._dom = {
		alphabet: document.querySelector("#alphabet"),
		go: document.querySelector("#go"),
		hashes: document.querySelector("#hashes"),
		workers: document.querySelector("#workers"),
		results: document.querySelector("#results"),
		stats: document.querySelector("#stats"),
		algo: document.querySelector("#algo")
	}

	this._dom.go.addEventListener("click", this._toggle.bind(this));
	this._dom.workers.addEventListener("change", this._updateWorkers.bind(this));
}

App.prototype._updateStats = function() {
	var ts = Date.now();
	var current = ts-this._stats.currentTS;

	var speed = this._work - this._stats.currentWork;
	speed /= (current/1000);
	this._stats.currentTS = ts;
	this._stats.currentWork = this._work;

	var sec = Math.round((ts-this._stats.start)/1000);
	var work = this._work/1e6;
	var str = "Running for " + sec + "s, tried " + work + "M strings";
	str += " (last one: '" + this._stats.last + "').<br/>";
	str += " Speed: " + Math.round(speed) + " strings/sec.";
	
	this._dom.stats.innerHTML = str; 
}

App.prototype._updateWorkers = function() {
	this._workerCount = parseInt(this._dom.workers.value);
	while (this._workers.length < this._workerCount) {
		var worker = this._createWorker();
		this._giveWork(worker);
	}
}

App.prototype._toggle = function() {
	if (this._workers.length) { /* stop */
		while (this._workers.length) { this._workers.pop().terminate(); }
		this._dom.go.innerHTML = "Start";
		this._dom.go.className = "";
		this._dom.alphabet.disabled = false;
		this._dom.hashes.disabled = false;
		this._dom.algo.disabled = false;
		clearInterval(this._interval);
	} else {
		this._work = this._stats.currentWork = 0;
		this._alphabet = this._dom.alphabet.value;
		this._algo = this._dom.algo.value;
		this._stats.start = this._stats.currentTS = Date.now();
		
		this._hashes = {};
		var hashes = this._dom.hashes.value.split("\n");
		while (hashes.length) {
			var hash = hashes.pop().trim();
			this._hashes[hash] = "";
		}
		
		this._updateStats();
		this._updateWorkers();
		this._dom.results.value = "";
		this._dom.go.innerHTML = "Stop";
		this._dom.go.className = "running";
		this._dom.alphabet.disabled = true;
		this._dom.hashes.disabled = true;
		this._dom.algo.disabled = true;

		this._interval = setInterval(this._updateStats.bind(this), 1000);
	}
}

App.prototype._createWorker = function() {
	var worker = new Worker("worker.js");
	this._workers.push(worker);
	worker.postMessage({
		type: "setup",
		alphabet: this._alphabet,
		hashes: this._hashes,
		algo: this._algo
	});
	worker.addEventListener("message", this._message.bind(this));
	return worker;
}

App.prototype._giveWork = function(worker) {
	var amount = 10000;
	
	worker.postMessage({
		type: "work",
		start: this._work,
		amount: amount
	});
	this._work += amount;
}

App.prototype._message = function(e) {
	var worker = e.target;
	
	this._stats.last = e.data.last;
	var hashes = e.data.hashes;

	for (var hash in hashes) {
		this._dom.results.value += hash + " = " + hashes[hash] + "\n";
	}
	
	this._giveWork(worker);
	
	if (this._workers.length > this._workerCount) {
		var index = this._workers.indexOf(worker);
		this._workers.splice(index, 1);
		worker.terminate();
	}
}
