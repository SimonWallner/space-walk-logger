const MARKER_START = "[LostLog]";
const MARKER_END = "[/LostLog]";

// init space walk lib
var libsw = new LibSpaceWalk();
libsw.onSessionStarted = function() { clear(); }
libsw.onMessage = function(data) {
	if (data.type == 'litg.lostLog.Message') {
		var payload = data.payload
		logLine(payload);
	}
}




var log = [];
var tags = new Set();

var container = d3.select('#container');

function clear() {
	// clear all
	d3.select('#tagNav').selectAll('div').remove();
	d3.select('#container').selectAll('div').remove();

	log = [];
	tags = new Set();
	tags.clear();
}

function logLine(line) {

	if (!container) {
		var container = d3.select('#container');
	}

	var div = container.append('div')
		.classed('logLine', true)
		.classed(line.level, true);

	div.append('span').classed('time', true).text(line.time);
	div.append('span').classed('message', true).text(line.message);

	var moreInfo = div.append('div').classed('moreInfo', true);
	moreInfo.append('span').classed('thread', true).text(line.thread)

	moreInfo.append('ul').classed('tags', true)
		.selectAll('li').data(line.tags)
			.enter()
				.append('li')
				.text((d) => d);

	moreInfo.append('ul').classed('stackTrace', true)
		.selectAll('li').data(line.stackFrames)
			.enter()
				.append('li')
				.text((d) => d);

	div.on('click', () => {
		div.classed('extended', !div.classed('extended'));
	})


}

function parse(inputText, isPlayStation)
{
	console.log('parsing...');
	var lines = inputText.split('\n');
	var json = "";
	var boring = [];
	var captureJson = false;
	tags.clear();
	var parseErrors = 0;


	for (var i = 0; i < lines.length; i++)
	{
		var line = isPlayStation ? lines[i].substring(9) : lines[i];
		line = line.replaceAll("\n", "");

		if (line.startsWith(MARKER_START))
		{
			log.push({
				boring: boring
			})

			json = "";
			captureJson = true;

			continue;
		}

		if (line.startsWith(MARKER_END))
		{
			try{
				var fancy = JSON.parse(json)
				log.push({
					fancy: fancy
				})
				fancy.tags.forEach(element => {
					tags.add(element)
				})
			}
			catch(e) {
				console.log("json parse error: " + e.message)
				console.log(json);
				parseErrors++;
			}


			captureJson = false;
			boring = [];

			continue;
		}

		if (captureJson)
		{
			json += line;
			continue
		}
		else {
			boring.push(line);
			continue;
		}
	}

	// close open boring lines
	if (boring.length > 0)
	{
		log.push({
			boring: boring
		})
	}

	if (parseErrors > 0)
	{
		window.alert(parseErrors + ' parse error(s) occured. See log for details');
	}

	console.log("parsed " + log.length + " entries");
	var container = d3.select('#container');

	container.selectAll('div').remove();

	// draw log lines
	for (var i = 0; i < log.length; i++)
	{
		var line = log[i];

		// skip empty boring blocks
		if (line.boring)
		{
			var isEmpty = line.boring.reduce((accumulator, currentValue) => {
				return accumulator && (currentValue == "")
			}, true);

			if (isEmpty)
			{
				continue;
			}
		}

		var logLine = container.append('div')
			.attr('class', line.fancy ? 'fancyLine' : 'boringLine');

		if (line.fancy)
		{
			logLine.append('span')
			.attr('class', 'time')
			.text('[' + line.fancy.time + ']');
		}

		logLine.append('span')
			.attr('class', 'message')
			.html(line.fancy ? line.fancy.message : line.boring.join('<br>'));

		if (line.fancy)
		{
			logLine.classed(line.fancy.logLevel, true);

			line.fancy.tags.forEach(element => {
				logLine.classed(element, true);
			});

			logLine.append('div')
				.attr('class', 'tags')
				.selectAll('.tag').data(line.fancy.tags)
					.enter()
						.append('div')
						.attr('class', 'tag')
						.text((d) => d);

			logLine.append('ul').selectAll('li').data(line.fancy.stackTrace)
				.enter()
					.append('li')
					.text((d) => d)
		}
	}

	// add tag switches

	tags.add("boringLine");
	tags.add("fancyLine");
	tagsArray = Array.from(tags);

	var nav = d3.select('#tagNav');
	for (var i = 0; i < tagsArray.length; i++)
	{
		let tag = tagsArray[i];
		nav.append('div').attr('class', 'tagButton active')
		.text(tag)
		.on('click', function(){
			d3.select(this).classed('active', !d3.select(this).classed('active'));
			var active = d3.select(this).classed('active');

			d3.selectAll('.' + tag).classed('hidden', !active);
		})
	}
}


$(document).ready(function() {

	var parseField = function()
	{
		parse($('#input').val(), $('#isPlaystation').prop('checked'));
	}

	$('#input').change(function() {
		parseField();
	})

	$('#isPlaystation').click(() =>
	{
		parseField();
	});

	d3.select('#stackTrace').on('click', () =>
	{
		d3.select('#stackTrace').classed('active', !d3.select('#stackTrace').classed('active'));
		var active = d3.select('#stackTrace').classed('active');

		d3.select('#container').classed('hideStackTrace', !active);
	});
})

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};