console.log("flow script connected")

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

const agentType = document.getElementById('agent-link')
document.getElementById('demographics').addEventListener('click', (e) => {
    e.preventDefault()
    redirectToQualtrics()
})

const idInteger = parseInt(participantID)

if (participantID % 2 == 0) {
    agentType.href = ""
} else {
    agentType.href = ""
}