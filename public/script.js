console.log("script connected");

const inputField = document.getElementById('user-input');
const sendBtn =  document.getElementById('send-btn');
const messagesContainer = document.getElementById('messages');

let conversationHistory = []

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

        const payload = conversationHistory.length === 0
            ? { input: inputText } // First submission, send only input
            : { history: conversationHistory, input: inputText }

        const target = '/chat'

        const response = await fetch(target, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        })

        const data = await response.json();

        conversationHistory.push({ role: 'user', content: inputText })
        conversationHistory.push({ role: 'assistant', content: data.botResponse})

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

function logEvent(type, element) {
    fetch('/log-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType: type, elementName: element, timestamp: new Date() })
    });
  }
  
  // Log click events on the "Submit" button
sendBtn.addEventListener('click', () => {
    logEvent('click', 'Send Button');
});
  
  // Log hover and focus events on the input field
inputField.addEventListener('mouseover', () => {
    logEvent('hover', 'User Input');
});
  
inputField.addEventListener('focus', () => {
    logEvent('focus', 'User Input');
});
