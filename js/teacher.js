const recognition = new webkitSpeechRecognition();
const textArea = $("#resultShowArea");

recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.continuous = true;

recognition.onresult = function(event) {
	if (event.results.length > 0) {
		console.log(event.results);
		let recognize = event.results[event.results.length - 1][0].transcript;

		//WebSocketに送信
		sendMessage(recognize);
		
		//ログに出力
		addSpeechText(recognize, 1);	
	}
}

function micStart() {
	recognition.start();
	$("#parotBtn").prop("disabled", true);
}

function onSend() {
	let message = $("#actionEnter").val();
	sendMessage(message);
	addSpeechText(message, 1);	
}

var socketio = io();

socketio.on("connected", function(msg){
	console.log("Socket Connected!");
});

socketio.on("publish", function(data) {
	console.log(data)
	getMessage(data.value);
});

socketio.on("disconnect", function(){
	console.log("Socket Disconnected");
})

//Socketを受け取った時の処理
function getMessage(data) {
	console.log(data)
	if (data.from == "student") {
		addSpeechText(data.message, 0);
	}
}

//Socket送信処理
function sendMessage(text) {
	let message = {
		from: "teacher",
		message: text
	};
	socketio.emit("publish", message);
}

function addSpeechText(text, who) {
	let recP;
	if (who == 0) {
		recP = $("</p>").text("生徒：" + text + ".");
	} else {
		recP = $("</p>").html("先生（あなた）：" + text);
	}
    $("#resultShowArea").append(recP).scrollTop($("#resultShowArea")[0].scrollHeight);
}