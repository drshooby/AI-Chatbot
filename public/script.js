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
            messagesContainer.insertAdjacentHTML('beforeend', `<div class="message"><strong class="name">You</strong>: ${interaction.userInput}</div>`);
            messagesContainer.insertAdjacentHTML('beforeend', `<div class="messageDiv"><div class="response"><strong class="name">Bot</strong>: ${formatResponse}</div><div>`);
            // Add to conversation history
            conversationHistory.push({ role: 'user', content: interaction.userInput });
            conversationHistory.push({ role: 'assistant', content: interaction.botResponse });
        });

        // Ensure old bot messages can be copied
        const divs = document.querySelectorAll('.messageDiv');
        divs.forEach(div => {
            div.addEventListener('click', async () => {
                try {
                    const htmlToCopy = div.innerHTML;
        
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'text/html': new Blob([htmlToCopy], { type: 'text/html' })
                        })
                    ]);
        
                    alert('Bot text copied!');
                } catch (err) {
                    console.error('Failed to copy HTML: ', err);
                }
            });
        });
    }

    // Scroll to latest message
    const newestMessage = messagesContainer.lastElementChild;
    if (newestMessage) {
        newestMessage.scrollIntoView({ behavior: 'smooth' });
    }
}

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
        messagesContainer.insertAdjacentHTML('beforeend', `<div class="message"><strong class="name">You</strong>: ${inputText}</div>`);

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

        botElement = `<div class="response"><strong class="name">Bot</strong>: ${formatResponse}</div>`

        const newMessageDiv = document.createElement('div');
        newMessageDiv.classList.add('messageDiv');
        newMessageDiv.innerHTML = botElement;
        messagesContainer.appendChild(newMessageDiv);

        // Ensure the new bot response can be copied
        newMessageDiv.addEventListener('click', async () => {
            try {
                const htmlToCopy = newMessageDiv.innerHTML;
                await navigator.clipboard.write([new ClipboardItem({
                    'text/html': new Blob([htmlToCopy], { type: 'text/html' })
                })]);

                alert('Bot text copied!');
            } catch (err) {
                console.error('Failed to copy HTML: ', err);
            }
        });

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
    logEvent('click', 'Download Button');
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

// Saving deltas for the notes
var Delta = Quill.import('delta');
var change = new Delta();
quill.on('text-change', (delta) => {
  change = change.compose(delta);
});

quill.on('hover', () => {
    logEvent('hover', 'Notes');
});

// save every 5 seconds
setInterval(() => {
  if (change.length() > 0) {
    console.log('Saving changes', change);
    fetch('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
	participantID,
        doc: quill.getContents().ops,
        timestamp: new Date()
      })
    });
    change = new Delta();
  }
}, 3000);

async function fetchNotes() {
    const response = await fetch('/getnotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
	participantID
      })
    });
    const data = await response.json();
    //console.log(data.doc);
    quill.setContents(data.doc);
}

// Check for unsaved data
window.onbeforeunload = () => {
  if (change.length() > 0) {
    return 'Notes have unsaved changes. Are you sure you want to leave?';
  }
}

// Load history when agent loads
window.onload = () => {
  loadConversationHistory();
  fetchNotes();
}
