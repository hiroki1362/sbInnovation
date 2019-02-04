let recognition = null;
let textArea = null;
let speechAudio = null;
let socketio = null;
let AWS_REGION = "";
let ACCESS_KEY = "";
let SECRET_ACCESS_KEY = "";
let polly = null;
let pollyParams = {
        OutputFormat: "mp3",
        SampleRate: "8000",
        Text: '',
        TextType: "text",
        VoiceId: "Joanna"
    };

 let isSpeeching = false;

const BIT = 1024;

$(function() {

	textArea = $("#resultShowArea");
	speechAudio = $("#speechAudio");

	$.ajax({
		url: 'polly.txt',
		dataType: "json"
	})
	.done(function(data) {
		initSpeechRecognize();
		initSocket();
		AWS_REGION = data.region;
	})
	.fail(function() {
		console.log("error");
	})
	.always(function() {
		console.log("complete");
	});

	speechAudio.on("ended", function() {
		isSpeeching = false;
		changeAnimation(0);
	});

	//$("#characterCanvas").on("click", changeAnimation);
});

function setParameter() {
	$("#keyInput").css("display", "none");
	$("#content").css("display", "block");

	ACCESS_KEY = $("#accessKey").val();
	SECRET_ACCESS_KEY = $("#secretKey").val();

	/*
	let phrase = data.phrase;
	let rsaKey = cryptico.generateRSAKey(phrase, BIT);
	
	let accessKey = cryptico.decrypt(ACCESS_KEY, rsaKey);
	let secretKey = cryptico.decrypt(SECRET_ACCESS_KEY, rsaKey);
	*/

	//AWS.config.update({accessKeyId: accessKey.plaintext, secretAccessKey: secretKey.plaintext, region: AWS_REGION});

	AWS.config.update({accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_ACCESS_KEY, region: AWS_REGION});
	polly = new AWS.Polly({apiVersion: '2016-06-10'});
}

//Chromeのテキスト化処理
function initSpeechRecognize() {
	recognition = new webkitSpeechRecognition();
	recognition.lang = 'en-US';
	recognition.interimResults = false;
	recognition.continuous = true;
	recognition.onresult = function(event) {
		if (event.results.length > 0 && !isSpeeching) {
			console.log(event.results);
			let recognize = event.results[event.results.length - 1][0].transcript;

			//WebSocketに送信
			sendMessage(recognize);
			
			//ログに出力
			addSpeechText(recognize, 0);	
		}
	}
}

//ソケットの初期化
function initSocket() {
	socketio = io();

	socketio.on("connected", function(msg){
		console.log("Socket Connected!");
	});

	socketio.on("publish", function(data) {
		getMessage(data.value);
	});

	socketio.on("disconnect", function(){
		console.log("Socket Disconnected");
	});
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
			let uInt8Array = new Uint8Array(data.AudioStream);
			let blob = new Blob([uInt8Array.buffer]);
			speechAudio.attr("src", URL.createObjectURL(blob));
			isSpeeching = true;
			speechAudio[0].play();
			changeAnimation(1);
		}
	});
}

function addSpeechText(text, who) {
	let recP;
	if (who == 0) {
		recP = $("</p>").text("あなた：" + text + ".");
	} else {
		recP = $("</p>").html("先生：" + text);
	}

    $("#resultShowArea").append(recP).scrollTop($("#resultShowArea")[0].scrollHeight);
}

//Socketを受け取った時の処理
function getMessage(data) {
	if (data.from == "teacher") {
		onSpeech(data.message);
		addSpeechText(data.message, 1);
	}
}

//Socket送信処理
function sendMessage(text) {
	let message = {
		from: "student",
		message: text
	};
	socketio.emit("publish", message);
}