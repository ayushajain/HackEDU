/*
Twenty by HTML5 UP
html5up.net | @n33co
Free for personal and commercial use under the CCA 3.0 license (html5up.net/license)
*/

(function($) {
	var ref = new Firebase("https://hackedu.firebaseio.com/");
	var currentKey = "";

	$("#upload-file").click(function(){
		$("#file-input").click();
	});

	$("#file-input").change(function(){
		readImage( this );
	});

	ref.child('finished').on('child_added', function(snapshot){
		if(snapshot.key() == currentKey){
			$("#rawtext").text(snapshot.val().raw);
			$("#summarytext").text(snapshot.val().summ);
		}
	});


	//load question
	var options = [1,2,3,4];
	var questions;
	var currentQuestion = 1;



	$(".answers").click(function(){

		var question = questions[currentQuestion];
		if($(this).text() == question['a']){
			console.log("correct")
			currentQuestion++;
			loadQuestion(currentQuestion);
		}
	});


	function loadQuestion(num){
		var question = questions[num.toString()];
		var answers = []

		console.log(question['q'])
		$("#question").text(question['q'])

		var count = 0;
		for(var i in question['w']){
			answers[count] = question['w'][i]
			count++;
		}
		answers.push(question['a'])

		options = shuffle(options);
		for(var i = 0; i <= 3; i++){
			$("#" + options[i]).text(answers[i]);
		}
	}

	function readImage(input) {
		if ( input.files && input.files[0] ) {
			var FR= new FileReader();
			var result = "empty";
			FR.onload = function(e) {
				var postRef = ref.child('temp').push(e.target.result);
				currentKey = postRef.key();
				console.log(currentKey)
			};
			FR.readAsDataURL(input.files[0]);
		}

	}

	function shuffle (array) {
		var i = 0
		, j = 0
		, temp = null

		for (i = array.length - 1; i > 0; i -= 1) {
			j = Math.floor(Math.random() * (i + 1))
			temp = array[i]
			array[i] = array[j]
			array[j] = temp
		}
		return array;
	}

	skel.breakpoints({
		wide: '(max-width: 1680px)',
		normal: '(max-width: 1280px)',
		narrow: '(max-width: 980px)',
		narrower: '(max-width: 840px)',
		mobile: '(max-width: 736px)'
	});

	$(function() {

		var	$window = $(window),
		$body = $('body'),
		$header = $('#header'),
		$banner = $('#banner');

		// Disable animations/transitions until the page has loaded.
		$body.addClass('is-loading');

		$window.on('load', function() {
			$body.removeClass('is-loading');
		});

		// CSS polyfills (IE<9).
		if (skel.vars.IEVersion < 9)
		$(':last-child').addClass('last-child');

		// Fix: Placeholder polyfill.
		$('form').placeholder();

		// Prioritize "important" elements on narrower.
		skel.on('+narrower -narrower', function() {
			$.prioritize(
				'.important\\28 narrower\\29',
				skel.breakpoint('narrower').active
			);
		});

		// Scrolly links.
		$('.scrolly').scrolly({
			speed: 1000,
			offset: -10
		});

		// Dropdowns.
		$('#nav > ul').dropotron({
			mode: 'fade',
			noOpenerFade: true,
			expandMode: (skel.vars.touch ? 'click' : 'hover')
		});

		// Off-Canvas Navigation.

		// Navigation Button.
		$(
			'<div id="navButton">' +
			'<a href="#navPanel" class="toggle"></a>' +
			'</div>'
		)
		.appendTo($body);

		// Navigation Panel.
		$(
			'<div id="navPanel">' +
			'<nav>' +
			$('#nav').navList() +
			'</nav>' +
			'</div>'
		)
		.appendTo($body)
		.panel({
			delay: 500,
			hideOnClick: true,
			hideOnSwipe: true,
			resetScroll: true,
			resetForms: true,
			side: 'left',
			target: $body,
			visibleClass: 'navPanel-visible'
		});

		// Fix: Remove navPanel transitions on WP<10 (poor/buggy performance).
		if (skel.vars.os == 'wp' && skel.vars.osVersion < 10)
		$('#navButton, #navPanel, #page-wrapper')
		.css('transition', 'none');

		// Header.
		// If the header is using "alt" styling and #banner is present, use scrollwatch
		// to revert it back to normal styling once the user scrolls past the banner.
		// Note: This is disabled on mobile devices.
		if (!skel.vars.mobile
			&&	$header.hasClass('alt')
			&&	$banner.length > 0) {

				$window.on('load', function() {

					$banner.scrollwatch({
						delay:		0,
						range:		1,
						anchor:		'top',
						on:			function() { $header.addClass('alt reveal'); },
						off:		function() { $header.removeClass('alt'); }
					});

				});

			}

		});

	})(jQuery);
