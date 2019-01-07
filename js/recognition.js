const recognition = new webkitSpeechRecognition();
//const utterThis = new SpeechSynthesisUtterance();
//const voice = window.speechSynthesis;
const textArea = $("#resultShowArea");
const speechAudio = $("#speechAudio");

const AWS_REGION = "ap-northeast-1";
const ACCESS_KEY = "AKIAJZS36AMPSNUU5CFQ";
const SECRET_ACCESS_KEY = "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";

AWS.config.update({accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_ACCESS_KEY, region: AWS_REGION});
let polly = new AWS.Polly({apiVersion: '2016-06-10'});
let pollyParams = {
        OutputFormat: "mp3",
        SampleRate: "8000",
        Text: '',
        TextType: "text",
        VoiceId: "Joanna"
    };

recognition.lang = 'en-US';
//utterThis.lang = "en-US";
recognition.interimResults = false;
recognition.continuous = true;

recognition.onresult = function(event) {
	if (event.results.length > 0) {
		isSpeeching = true;
		console.log(event.results);
		let recognize = event.results[event.results.length - 1][0].transcript;
		addSpeechText(recognize, 0);

		//WebSocketに送信
		sendMessage(recognize);
		
		onSpeech(recognize);		
	}
}

function micStart() {
	recognition.start();
	$("#parotBtn").prop("disabled", true);

}

//AWS Pollyで発話
function onSpeech(speechText) {	
	pollyParams.Text = speechText;
	polly.synthesizeSpeech(pollyParams, function(err, data) {
		if (err) {
			console.log(err);
		} else {
			console.log(data);
			let uInt8Array = new Uint8Array(data.AudioStream);
			let blob = new Blob([uInt8Array.buffer]);
			speechAudio.attr("src", URL.createObjectURL(blob));
			speechAudio[0].play();
		}
	});
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