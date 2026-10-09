"""Rebuild the original local ambient track; Python standard library only."""
from pathlib import Path
import math
import struct
import wave

RATE = 22050
DURATION = 16
NOTES = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66,
         261.63, 349.23, 440, 523.25, 493.88, 392, 329.63, 293.66]
OUTPUT = Path(__file__).resolve().parent.parent / 'public/assets/sounds/sunday.wav'
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(OUTPUT), 'w') as sound:
    sound.setnchannels(1)
    sound.setsampwidth(2)
    sound.setframerate(RATE)
    for i in range(RATE * DURATION):
        t = i / RATE
        k = int(t)
        u = t - k
        n = NOTES[k % len(NOTES)]
        envelope = (1 - math.exp(-u * 40)) * math.exp(-u * 3.5)
        melody = .15 * envelope * (math.sin(2 * math.pi * n * t)
                                  + .3 * math.sin(2 * math.pi * n * 2 * t))
        pad = .035 * (math.sin(2 * math.pi * 130.815 * t)
                      + math.sin(2 * math.pi * 164.815 * t)
                      + math.sin(2 * math.pi * 196 * t)) * math.sin(math.pi * t / DURATION) ** 2
        sound.writeframesraw(struct.pack('<h', int((melody + pad) * 32767)))
print(OUTPUT)
