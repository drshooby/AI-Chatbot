console.log("flow script connected")

const agentType = document.getElementById('agent-link')

function logEvent(type, element) {
    fetch('/log-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: type, elementName: element, timestamp: new Date(), participantID })
    });
}

const participantID = localStorage.getItem('participantID');

if (!participantID) {
    alert("Participant id not found")
    window.location.href = "/"
}

if (participantID % 2 == 0) {
    agentType.href = "/chat"
} else {
    agentType.href = `https://ai-agent-8xuj.onrender.com/chat?participantID=${participantID}`
}

function redirectToQualtrics() {
    fetch('/redirect-to-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantID }) // participantID from localStorage
    })
    .then(response => response.text()) // Get the URL from the response
    .then(url => {
        // Log the redirect event if you're using event logging
        logEvent('redirect', 'Qualtrics Survey');
        // Redirect to the survey
        window.location.href = url;
    })
    .catch(error => {
        console.error('Error redirecting to survey:', error);
        alert('There was an error redirecting to the survey. Please try again.');
    });
}

const h3 = document.getElementsByTagName('h3')
h3[0].textContent += participantID

const idInteger = parseInt(participantID)

if (participantID % 2 == 0) {
    agentType.href = "/chat"
} else {
    agentType.href = `https://ai-agent-8xuj.onrender.com/chat?participantID=${participantID}`
}

document.getElementById('demographics').addEventListener('click', (e) => {
    e.preventDefault()
    redirectToQualtrics()
})