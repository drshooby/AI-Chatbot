console.log("script connected");

const participantID = localStorage.getItem('participantID');
if (!participantID) {
    alert('Please enter a participant ID.')
    window.location.href = '/';
}

let conversationHistory = []

async function loadConversationHistory() {

    const target = '/history'

    const response = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantID }) // Send participantID to the server
    });

    const data = await response.json();
    if (data.interactions && data.interactions.length > 0) {
        data.interactions.forEach(interaction => {
	    let formatResponse = marked.parse(interaction.botResponse);
            messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">You: ${interaction.userInput}</p>`);
            messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">Bot: ${formatResponse}</p>`);
            // Add to conversation history
            conversationHistory.push({ role: 'user', content: interaction.userInput });
            conversationHistory.push({ role: 'assistant', content: interaction.botResponse });
        });
    }
}

// Load history when agent loads
window.onload = loadConversationHistory;

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

        const payload = conversationHistory.length === 0
            ? { input: inputText, participantID } // First submission, send only input
            : { history: conversationHistory, input: inputText, participantID }

        const target = '/chat'

        const response = await fetch(target, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        })

        const data = await response.json();

	let formatResponse = marked.parse(data.botResponse);

        conversationHistory.push({ role: 'user', content: inputText })
        conversationHistory.push({ role: 'assistant', content: data.botResponse})

        messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">Bot: ${formatResponse}</p>`);
        messagesContainer.insertAdjacentHTML('beforeend', `<p class="message">Relevant Links:</p>`);
        data.searchResults.forEach(result => {
            messagesContainer.insertAdjacentHTML('beforeend', `<a href="${result.url}"target="_blank">${result.title}</a><p>${result.snippet}</p>`)}
        );
        
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
      body: JSON.stringify({ eventType: type, elementName: element, timestamp: new Date(), participantID })
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

const quill = new Quill('#editor', {
    modules: {
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['image', 'link', 'code-block'],
        ],
      },
      placeholder: 'Your notes...',
      theme: 'snow', // or 'bubble'
});

const downloadBtn = document.getElementById('download-btn')
downloadBtn.addEventListener('click', () => {
    console.log('downloading')
    const content = quill.root.innerHTML

    const opt = {
        margin: 1,
        filename: 'my-notes.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 1 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }

    html2pdf().set(opt).from(content).save()
})
