import { useEffect, useRef } from 'react';
import { Audio, type AVPlaybackSource } from 'expo-av';

const SOUNDS = {
  expense: require('@/assets/sounds/expense.wav') as AVPlaybackSource,
  income:  require('@/assets/sounds/income.wav')  as AVPlaybackSource,
  error:   require('@/assets/sounds/error.wav')   as AVPlaybackSource,
};

type SoundKey = keyof typeof SOUNDS;

export function useSound() {
  const loaded = useRef<Partial<Record<SoundKey, Audio.Sound>>>({});

  useEffect(() => {
    let mounted = true;

    async function preload() {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      for (const [key, source] of Object.entries(SOUNDS) as [SoundKey, AVPlaybackSource][]) {
        try {
          const { sound } = await Audio.Sound.createAsync(source, { volume: 0.7 });
          if (mounted) loaded.current[key as SoundKey] = sound;
        } catch {
          // ignore per-sound load failure
        }
      }
    }

    preload().catch(() => {});

    return () => {
      mounted = false;
      for (const sound of Object.values(loaded.current)) {
        sound.unloadAsync().catch(() => {});
      }
      loaded.current = {};
    };
  }, []);

  async function play(key: SoundKey) {
    try {
      const sound = loaded.current[key];
      if (!sound) return;
      await sound.setPositionAsync(0);
      await sound.playAsync();
    } catch {
      // never crash the UI over a sound
    }
  }

  return { play };
}
