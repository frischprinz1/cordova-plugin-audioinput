import { Capacitor } from '@capacitor/core';

let captureStarted = false;
let audioDataCount = 0;

window.log = function(message, type = 'info') {
    const status = document.getElementById('status');
    const timestamp = new Date().toLocaleTimeString();
    const icon = {
        'success': '✓',
        'error': '✗',
        'info': 'ℹ',
        'warning': '⚠'
    }[type] || '';

    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `[${timestamp}] ${icon} ${message}`;
    status.appendChild(entry);
    status.scrollTop = status.scrollHeight;

    console.log(`[${type}] ${message}`);
}

window.clearLog = function() {
    document.getElementById('status').innerHTML = '';
    log('Log cleared', 'info');
}

function updateButtons() {
    document.getElementById('startBtn').disabled = captureStarted;
    document.getElementById('stopBtn').disabled = !captureStarted;
}

window.getPermission = function() {
    log('Requesting microphone permission...', 'info');

    if (window.audioinput && audioinput.checkMicrophonePermission) {
        audioinput.checkMicrophonePermission(
            function(hasPermission) {
                if (hasPermission) {
                    log('Permission already granted', 'success');
                } else {
                    log('Requesting permission...', 'info');
                    audioinput.getMicrophonePermission(
                        function(granted) {
                            log(granted ? 'Permission granted' : 'Permission denied', granted ? 'success' : 'error');
                        },
                        function(error) {
                            log('Error requesting permission: ' + error, 'error');
                        }
                    );
                }
            },
            function(error) {
                log('Error checking permission: ' + error, 'error');
            }
        );
    } else {
        log('Permission API not available', 'error');
    }
}

window.checkMicrophonePermission = function() {
    log('Checking microphone permission...', 'info');

    if (window.audioinput && audioinput.checkMicrophonePermission) {
        audioinput.checkMicrophonePermission(
            function(hasPermission) {
                log(hasPermission ? 'Has microphone permission' : 'No microphone permission', hasPermission ? 'success' : 'warning');
            },
            function(error) {
                log('Error checking permission: ' + error, 'error');
            }
        );
    } else {
        log('Check permission API not available', 'error');
    }
}

window.startCapture = function() {
    log('Starting audio capture...', 'info');
    audioDataCount = 0;

    if (!window.audioinput) {
        log('AudioInput plugin not found!', 'error');
        return;
    }

    const captureCfg = {
        sampleRate: 44100,
        bufferSize: 4096,
        channels: 1,
        format: 'PCM_16BIT',
        normalize: true,
        normalizationFactor: 32767.0
    };

    audioinput.start(captureCfg);

    // Listen for audio input events
    window.addEventListener('audioinput', onAudioInput, false);
    window.addEventListener('audioinputerror', onAudioInputError, false);

    captureStarted = true;
    updateButtons();
    log('Capture started', 'success');
    log(`Config: ${JSON.stringify(captureCfg, null, 2)}`, 'info');
}

window.stopCapture = function() {
    log('Stopping audio capture...', 'info');

    if (window.audioinput) {
        audioinput.stop();
        window.removeEventListener('audioinput', onAudioInput, false);
        window.removeEventListener('audioinputerror', onAudioInputError, false);
        log(`Capture stopped. Received ${audioDataCount} audio data events`, 'success');
    }

    captureStarted = false;
    updateButtons();
}

function onAudioInput(evt) {
    audioDataCount++;
    if (audioDataCount === 1 || audioDataCount % 20 === 0) {
        const dataLength = evt.data ? evt.data.length : 'N/A';
        log(`Audio data received (chunk #${audioDataCount}, length: ${dataLength})`, 'success');
    }
}

function onAudioInputError(error) {
    log('Audio input error: ' + JSON.stringify(error), 'error');
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    log('DOM Content Loaded', 'info');
    log(`Platform: ${Capacitor.getPlatform()}`, 'info');
    log(`Native: ${Capacitor.isNativePlatform()}`, 'info');

    // Check for plugin
    setTimeout(() => {
        if (window.audioinput) {
            log('AudioInput plugin loaded', 'success');
            const methods = Object.keys(window.audioinput).filter(key => typeof window.audioinput[key] === 'function');
            log(`Plugin methods: ${methods.join(', ')}`, 'info');
        } else {
            log('AudioInput plugin NOT found!', 'error');
            log('Make sure to install the plugin and sync platforms', 'warning');
        }
    }, 500);
});
