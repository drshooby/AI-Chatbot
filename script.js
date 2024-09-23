console.log("script connected");

const inputField = document.getElementById('user-input');
const sendBtn =  document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');

let inputText = "";

inputField.addEventListener('input', () => {
    inputText = inputField.value;
});

inputField.addEventListener('keydown', (keyEvent) => {
    if (keyEvent.key == 'Enter') {
        sendMessage();
    }
});

sendBtn.addEventListener('click', sendMessage);

function sendMessage() {
    inputText = inputText.trim()
    if (inputText) {
        messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">${inputText}</p>`);
    } else {
        alert("Empty message body");
    }
    inputField.value = '';
}
