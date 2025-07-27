document.addEventListener('DOMContentLoaded', () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [];
    const numNotes = 5;

    const baseFreqInput = document.getElementById('base-freq');
    const noteControlsContainer = document.getElementById('note-controls');
    const overtonePreset = document.getElementById('overtone-preset');
    const overtoneTableBody = document.querySelector('#overtone-table tbody');
    const addOvertoneButton = document.getElementById('add-overtone');
    const clashTableBody = document.querySelector('#clash-table tbody');
    const a2Button = document.getElementById('a2-button');
    const a3Button = document.getElementById('a3-button');
    const a4Button = document.getElementById('a4-button');

    const overtonePresets = {
        sine: [
            { enabled: true, multiplier: 1, magnitude: 1.0 }
        ],
        guitar: [
            { enabled: true, multiplier: 1, magnitude: 1.0 },
            { enabled: true, multiplier: 2, magnitude: 0.5 },
            { enabled: true, multiplier: 3, magnitude: 0.33 },
            { enabled: true, multiplier: 4, magnitude: 0.21 },
            { enabled: true, multiplier: 5, magnitude: 0.2 }
        ],
        bell: [
            { enabled: true, multiplier: 0.5, magnitude: 0.3 },
            { enabled: true, multiplier: 1, magnitude: 0.7 },
            { enabled: true, multiplier: 1.2, magnitude: 0.8 },
            { enabled: true, multiplier: 1.5, magnitude: 0.6 },
            { enabled: true, multiplier: 2, magnitude: 1.0 }
        ],
        custom: []
    };


    let currentOvertones = overtonePresets.sine;
    let isolationMode = null;

    function createNote(index) {
        const noteControl = document.createElement('div');
        noteControl.className = 'note-control';
        noteControl.innerHTML = `
            <label>Note ${index + 1}</label>
            <div>
                <input type="number" class="note-semitones" value="0" step="0.1">
                <span>semitones</span>
            </div>
            <input type="checkbox" class="note-toggle">
        `;
        noteControlsContainer.appendChild(noteControl);

        const toggle = noteControl.querySelector('.note-toggle');
        const semitonesInput = noteControl.querySelector('.note-semitones');

        const note = {
            oscillators: [],
            semitones: 0,
            isPlaying: false,
            toggle,
            semitonesInput
        };

        toggle.addEventListener('change', () => {
            note.isPlaying = toggle.checked;
            if (note.isPlaying) {
                startNote(note);
            } else {
                stopNote(note);
            }
            calculateAndDisplayClashes();
        });

        semitonesInput.addEventListener('input', () => {
            note.semitones = parseFloat(semitonesInput.value);
            if (note.isPlaying) {
                updateNoteFrequency(note);
            }
            calculateAndDisplayClashes();
        });

        return note;
    }

    function getFrequency(semitones) {
        const baseFreq = parseFloat(baseFreqInput.value);
        return baseFreq * Math.pow(2, semitones / 12);
    }

    function startNote(note, isolatedOvertones = null) {
        stopNote(note); // Stop any existing oscillators for this note

        const baseFreq = getFrequency(note.semitones);
        const overtonesToPlay = isolatedOvertones || currentOvertones.filter(o => o.enabled);

        overtonesToPlay.forEach(overtone => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            osc.frequency.value = baseFreq * overtone.multiplier;
            gainNode.gain.value = overtone.magnitude;

            osc.connect(gainNode);
            gainNode.connect(audioCtx.gain);
            osc.start();
            note.oscillators.push(osc);
        });
    }

    function stopNote(note) {
        note.oscillators.forEach(osc => osc.stop());
        note.oscillators = [];
    }

    function updateNoteFrequency(note) {
       // The frequency is now set when the note is started, 
       // so we just need to restart the note to update it.
       if (note.isPlaying) {
           startNote(note);
       }
    }
    
    function updateAllNotes() {
        notes.forEach(note => {
            if (note.isPlaying) {
                stopNote(note);
                startNote(note);
            }
        });
        calculateAndDisplayClashes();
    }

    function renderOvertoneTable() {
        overtoneTableBody.innerHTML = '';
        currentOvertones.forEach((overtone, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><input type="checkbox" class="overtone-enabled" data-index="${index}" ${overtone.enabled ? 'checked' : ''}></td>
                <td><input type="number" class="overtone-multiplier" value="${overtone.multiplier}" step="0.01" data-index="${index}"></td>
                <td><input type="number" class="overtone-magnitude" value="${overtone.magnitude}" step="0.01" data-index="${index}"></td>
                <td><button class="remove-overtone" data-index="${index}">Remove</button></td>
            `;
            overtoneTableBody.appendChild(row);
        });

        document.querySelectorAll('.remove-overtone').forEach(button => {
            button.addEventListener('click', (e) => {
                currentOvertones.splice(e.target.dataset.index, 1);
                renderOvertoneTable();
                updateAllNotes();
            });
        });

        document.querySelectorAll('.overtone-enabled, .overtone-multiplier, .overtone-magnitude').forEach(input => {
            input.addEventListener('input', (e) => {
                const index = e.target.dataset.index;
                const overtone = currentOvertones[index];
                if (e.target.type === 'checkbox') {
                    overtone.enabled = e.target.checked;
                } else if (e.target.classList.contains('overtone-multiplier')) {
                    overtone.multiplier = parseFloat(e.target.value);
                } else if (e.target.classList.contains('overtone-magnitude')) {
                    overtone.magnitude = parseFloat(e.target.value);
                }
                updateAllNotes();
            });
        });
    }

    function updateCustomOvertones() {
        const newOvertones = [];
        const rows = overtoneTableBody.querySelectorAll('tr');
        rows.forEach(row => {
            const enabled = row.querySelector('.overtone-enabled').checked;
            const multiplier = parseFloat(row.querySelector('.overtone-multiplier').value);
            const magnitude = parseFloat(row.querySelector('.overtone-magnitude').value);
            if (!isNaN(multiplier) && !isNaN(magnitude)) {
                newOvertones.push({ enabled, multiplier, magnitude });
            }
        });
        overtonePresets.custom = newOvertones;
        if (overtonePreset.value === 'custom') {
            currentOvertones = overtonePresets.custom;
        }
    }

    addOvertoneButton.addEventListener('click', () => {
        currentOvertones.push({ enabled: true, multiplier: currentOvertones.length + 1, magnitude: 0.1 });
        renderOvertoneTable();
        updateAllNotes();
    });

    overtonePreset.addEventListener('change', () => {
        currentOvertones = overtonePresets[overtonePreset.value];
        renderOvertoneTable();
        updateAllNotes();
    });

    baseFreqInput.addEventListener('input', () => {
        notes.forEach(note => {
            if (note.isPlaying) {
                updateNoteFrequency(note);
            }
        });
        calculateAndDisplayClashes();
    });

    function setBaseFreq(freq) {
        baseFreqInput.value = freq;
        const event = new Event('input');
        baseFreqInput.dispatchEvent(event);
    }

    a2Button.addEventListener('click', () => setBaseFreq(110));
    a3Button.addEventListener('click', () => setBaseFreq(220));
    a4Button.addEventListener('click', () => setBaseFreq(440));

    // Create initial notes
    for (let i = 0; i < numNotes; i++) {
        notes.push(createNote(i));
    }
    
    // Initial setup
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.1;
    gainNode.connect(audioCtx.destination);
    audioCtx.gain = gainNode;

    function calculateAndDisplayClashes() {
        clashTableBody.innerHTML = '';
        const activeFrequencies = [];

        notes.forEach((note, noteIndex) => {
            if (note.isPlaying) {
                const baseFreq = getFrequency(note.semitones);
                const enabledOvertones = currentOvertones.filter(o => o.enabled);
                enabledOvertones.forEach((overtone, overtoneIndex) => {
                    activeFrequencies.push({
                        noteIndex: noteIndex,
                        overtoneIndex: overtoneIndex,
                        frequency: baseFreq * overtone.multiplier,
                        overtone: overtone
                    });
                });
            }
        });

        for (let i = 0; i < activeFrequencies.length; i++) {
            for (let j = i + 1; j < activeFrequencies.length; j++) {
                const freq1 = activeFrequencies[i];
                const freq2 = activeFrequencies[j];

                const absDiff = Math.abs(freq1.frequency - freq2.frequency);
                const relDiff = 12 * Math.log2(freq1.frequency / freq2.frequency);

                if (absDiff < 30 || Math.abs(relDiff) < 1.2) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${freq1.noteIndex + 1}</td>
                        <td>${freq1.overtoneIndex + 1}</td>
                        <td>${freq2.noteIndex + 1}</td>
                        <td>${freq2.overtoneIndex + 1}</td>
                        <td>${absDiff.toFixed(2)}</td>
                        <td>${relDiff.toFixed(2)}</td>
                        <td><button class="isolate-clash" data-note1="${freq1.noteIndex}" data-overtone1="${freq1.overtoneIndex}" data-note2="${freq2.noteIndex}" data-overtone2="${freq2.overtoneIndex}">Isolate</button></td>
                    `;
                    clashTableBody.appendChild(row);
                }
            }
        }

        document.querySelectorAll('.isolate-clash').forEach(button => {
            button.addEventListener('click', (e) => {
                const { note1, overtone1, note2, overtone2 } = e.target.dataset;
                toggleIsolationMode(parseInt(note1), parseInt(overtone1), parseInt(note2), parseInt(overtone2));
            });
        });
    }

    function toggleIsolationMode(note1Index, overtone1Index, note2Index, overtone2Index) {
        if (isolationMode) {
            isolationMode = null;
            document.querySelectorAll('.isolate-clash').forEach(b => b.textContent = 'Isolate');
        } else {
            isolationMode = {
                note1Index,
                overtone1Index,
                note2Index,
                overtone2Index
            };
            document.querySelectorAll('.isolate-clash').forEach(b => b.textContent = 'Isolate');
            const button = document.querySelector(`[data-note1="${note1Index}"][data-overtone1="${overtone1Index}"][data-note2="${note2Index}"][data-overtone2="${overtone2Index}"]`);
            if(button) button.textContent = 'Unisolate';
        }
        
        notes.forEach((note, index) => {
            if (note.isPlaying) {
                if (isolationMode) {
                    if (index === note1Index && index === note2Index) {
                        const isolatedOvertones = [currentOvertones[overtone1Index], currentOvertones[overtone2Index]];
                        startNote(note, isolatedOvertones);
                    } else if (index === note1Index) {
                        startNote(note, [currentOvertones[overtone1Index]]);
                    } else if (index === note2Index) {
                        startNote(note, [currentOvertones[overtone2Index]]);
                    } else {
                        stopNote(note);
                    }
                } else {
                    startNote(note);
                }
            }
        });
    }

    renderOvertoneTable();
    calculateAndDisplayClashes();
});
