var socketio = io();

socketio.on("connected", function(msg){
	console.log("Socket Connected!");
});

socketio.on("publish", function(data) {
	getMessage(data.value);
});

socketio.on("disconnect", function(){
	console.log("Socket Disconnected");
})

//Socketを受け取った時の処理
function getMessage(data) {
	console.log("GET DATA!!");
}

//Socket送信処理
function sendMessage(text) {
	socketio.emit("publish", text);
}