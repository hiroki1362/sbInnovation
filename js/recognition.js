const recognition = new webkitSpeechRecognition();
const utterThis = new SpeechSynthesisUtterance();
const voice = window.speechSynthesis;
const textArea = $("#resultShowArea");

recognition.lang = 'en-US';
utterThis.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = true;

recognition.onresult = function(event) {
	if (event.results.length > 0) {
		console.log(event.results);
		let recognize = event.results[event.results.length - 1][0].transcript;
		addSpeechText(recognize, 0);
		onSpeech(recognize);		
	}
}

function micStart() {
	recognition.start();
}

function onSpeech(speechText) {
	let voiceList = voice.getVoices();
	utterThis.voice = voiceList[32];
	console.log(voiceList);
	utterThis.text = speechText;
	voice.speak(utterThis);
	addSpeechText(speechText, 1);
}


function addSpeechText(text, who) {
	let recP;
	if (who == 0) {
		recP = $("</p>").text("あなた：" + text + ".");
	} else {
		recP = $("</p>").html("先生：" + text + ".<br/>--------------------------------------");
	}

    $("#resultShowArea").append(recP).scrollTop($("#resultShowArea")[0].scrollHeight);
}