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

async function sendMessage() {
    inputText = inputText.trim()
    if (inputText) {
        messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">You: ${inputText}</p>`);

        const inputData = {
            chat: inputText
        }

        const target = '/chat'

        console.log(JSON.stringify(inputData))

        const response = await fetch(target, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(inputData)
        })

        const data = await response.json();

        messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">Bot: ${data.botResponse}</p>`);
        
        const newestMessage = messagesContainer.lastElementChild
        if (newestMessage) {
            newestMessage.scrollIntoView({behavior: 'smooth'})
        }
    } else {
        alert("Empty message body");
    }
    inputField.value = '';
}


