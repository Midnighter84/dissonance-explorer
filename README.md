# Dissonance Demo

This project is a web-based tool for exploring musical dissonance and the interaction of different musical notes and their overtones.

## Features

*   **Multi-Note Playback:** Play up to 5 notes simultaneously.
*   **Frequency Control:**
    *   Set a global base frequency.
    *   Adjust each note's frequency in semitones relative to the base frequency. Fractional semitones are supported.
*   **Overtone Composition:**
    *   Define a global overtone structure that applies to all notes.
    *   Configure overtones with a frequency multiplier and magnitude.
    *   Enable or disable individual overtones.
    *   Choose from presets like "Sine", "Guitar", and "Bell", or create a custom composition.
*   **Clash Detection:**
    *   Identifies and displays pairs of frequencies that are likely to sound dissonant (i.e., "clash").
    *   A clash is defined as two frequencies with an absolute difference of less than 30 Hz or a relative difference of less than 1.2 semitones.
*   **Isolate Clashes:**
    *   An "Isolate" button for each clash allows you to mute all other sounds and listen only to the two clashing overtones.

## How to Use

1.  Open the `index.html` file in a web browser.
2.  Use the controls to configure the base frequency, notes, and overtones.
3.  Toggle the notes on and off to hear the resulting sound.
4.  Observe the "Clashes" table to see which frequencies are dissonant.
5.  Use the "Isolate" button to listen to specific clashes.
