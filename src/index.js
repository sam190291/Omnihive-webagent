import { RetellWebClient } from 'retell-client-js-sdk';
import './style.css';

// Configuration
const CONFIG = {
    backendUrl: 'https://omnihive-webagent.netlify.app/.netlify/functions/create-web-call',
    defaultAgentId: 'agent_af91e55018eeeb36e5a2397bfb'
};

// Global variables
let retellWebClient;
let isCallActive = false;

// Get agent ID from URL
const urlParams = new URLSearchParams(window.location.search);
const agentId = urlParams.get('agentId') || CONFIG.defaultAgentId;

// UI elements
let callButton, status, agentStatus, agentIndicator, agentStatusText, transcript, transcriptContent;

// Initialize app
function initializeApp() {
    console.log('🚀 Omnihive Web Agent starting...');
    
    // Get UI elements
    callButton = document.getElementById('callButton');
    status = document.getElementById('status');
    agentStatus = document.getElementById('agentStatus');
    agentIndicator = document.getElementById('agentIndicator');
    agentStatusText = document.getElementById('agentStatusText');
    transcript = document.getElementById('transcript');
    transcriptContent = document.getElementById('transcriptContent');

    // Initialize Retell client
    retellWebClient = new RetellWebClient();
    console.log('✅ RetellWebClient initialized');
    
    // Set up event listeners
    setupEventListeners();
    
    console.log('✅ App ready with agent:', agentId);
    showStatus('Ready to start call!', 'active');
}

// Set up all event listeners
function setupEventListeners() {
    // Button click handler
    callButton.addEventListener('click', async () => {
        console.log('🎯 Button clicked! Current state:', isCallActive);
        try {
            if (!isCallActive) {
                await startCall();
            } else {
                stopCall();
            }
        } catch (error) {
            console.error('❌ Click handler error:', error);
            showStatus('Error: ' + error.message, 'error');
        }
    });

    // Retell event listeners
    retellWebClient.on("call_started", () => {
        console.log("📞 Call started");
        isCallActive = true;
        callButton.textContent = "🔴 End Call";
        callButton.disabled = false;
        showStatus('🎤 Call Active - Speak now!', 'active');
        agentStatus.style.display = 'block';
        transcript.style.display = 'block';
    });

    retellWebClient.on("call_ended", () => {
        console.log("📴 Call ended");
        isCallActive = false;
        callButton.textContent = "🎤 Start Call";
        callButton.disabled = false;
        status.style.display = 'none';
        agentStatus.style.display = 'none';
        agentIndicator.classList.remove('talking');
        agentStatusText.textContent = 'Agent Ready';
    });

    retellWebClient.on("agent_start_talking", () => {
        console.log("🗣️ Agent started talking");
        agentIndicator.classList.add('talking');
        agentStatusText.textContent = 'Agent Speaking...';
    });

    retellWebClient.on("agent_stop_talking", () => {
        console.log("🤫 Agent stopped talking");
        agentIndicator.classList.remove('talking');
        agentStatusText.textContent = 'Agent Listening...';
    });

    retellWebClient.on("update", (update) => {
        console.log("📝 Update received:", update);
        updateTranscript(update);
    });

    retellWebClient.on("error", (error) => {
        console.error("❌ Retell error:", error);
        showStatus('Call error occurred. Please try again.', 'error');
        isCallActive = false;
        callButton.textContent = "🎤 Start Call";
        callButton.disabled = false;
        retellWebClient.stopCall();
    });
}

// Update status display
function showStatus(message, type) {
    if (status) {
        status.textContent = message;
        status.className = `status ${type}`;
        status.style.display = 'block';
    }
}

// Update transcript
function updateTranscript(update) {
    if (update.transcript && transcriptContent) {
        transcriptContent.innerHTML += `<div style="margin: 8px 0; padding: 8px; background: #fff; border-radius: 5px; border-left: 3px solid #667eea;">${update.transcript}</div>`;
        transcript.scrollTop = transcript.scrollHeight;
    }
}

// Start call function
async function startCall() {
    try {
        console.log('🚀 Starting call with agent:', agentId);
        callButton.disabled = true;
        showStatus('Connecting to Omnihive AI...', 'connecting');

        console.log('📡 Calling backend:', CONFIG.backendUrl);
        
        const response = await fetch(CONFIG.backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                agentId: agentId
            })
        });

        console.log('📊 Backend response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Backend error:', errorText);
            throw new Error(`Backend error: ${response.status}`);
        }

        const callData = await response.json();
        console.log('🎫 Access token received, starting Retell call...');
        
        await retellWebClient.startCall({
            accessToken: callData.access_token,
            sampleRate: 24000,
            emitRawAudioSamples: false
        });

        console.log('✅ Call started successfully');

    } catch (error) {
        console.error('❌ Error starting call:', error);
        showStatus('Failed to start call: ' + error.message, 'error');
        callButton.disabled = false;
    }
}

// Stop call function
function stopCall() {
    console.log('⏹️ Stopping call...');
    retellWebClient.stopCall();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeApp);
