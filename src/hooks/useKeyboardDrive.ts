/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';

interface UseKeyboardDriveOptions {
  enabled: boolean;
  speedScale: number;
  onSetMotors: (left: number, right: number) => void;
  onEmergencyStop: () => void;
  onResetPosition: () => void;
  onManualOverride?: () => void;
}

export function useKeyboardDrive({
  enabled,
  speedScale,
  onSetMotors,
  onEmergencyStop,
  onResetPosition,
  onManualOverride,
}: UseKeyboardDriveOptions) {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) {
      setActiveKeys([]);
      return;
    }

    const keysDown = new Set<string>();

    const isTextInputFocused = (target: EventTarget | null): boolean => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target.isContentEditable
      );
    };

    const syncActiveKeys = () => {
      setActiveKeys(Array.from(keysDown));
    };

    const evaluateKeyDrive = () => {
      const forward = keysDown.has('w') || keysDown.has('arrowup');
      const backward = keysDown.has('s') || keysDown.has('arrowdown');
      const left = keysDown.has('a') || keysDown.has('arrowleft');
      const right = keysDown.has('d') || keysDown.has('arrowright');
      const spinLeft = keysDown.has('q');
      const spinRight = keysDown.has('e');

      let l = 0;
      let r = 0;

      if (spinLeft) {
        l = -speedScale;
        r = speedScale;
      } else if (spinRight) {
        l = speedScale;
        r = -speedScale;
      } else if (forward) {
        if (left) {
          l = speedScale * 0.4;
          r = speedScale;
        } else if (right) {
          l = speedScale;
          r = speedScale * 0.4;
        } else {
          l = speedScale;
          r = speedScale;
        }
      } else if (backward) {
        if (left) {
          l = -speedScale * 0.4;
          r = -speedScale;
        } else if (right) {
          l = -speedScale;
          r = -speedScale * 0.4;
        } else {
          l = -speedScale;
          r = -speedScale;
        }
      } else if (left) {
        l = -speedScale * 0.65;
        r = speedScale * 0.65;
      } else if (right) {
        l = speedScale * 0.65;
        r = -speedScale * 0.65;
      }

      if (l !== 0 || r !== 0) {
        onManualOverride?.();
      }
      onSetMotors(l, r);
    };

    const driveKeys = new Set([
      'w',
      'a',
      's',
      'd',
      'q',
      'e',
      'arrowup',
      'arrowdown',
      'arrowleft',
      'arrowright',
    ]);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTextInputFocused(e.target)) return;

      const key = e.key.toLowerCase();

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        keysDown.clear();
        syncActiveKeys();
        onEmergencyStop();
        return;
      }

      if (key === 'r' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        keysDown.clear();
        syncActiveKeys();
        onResetPosition();
        return;
      }

      if (!driveKeys.has(key)) return;
      if (key.startsWith('arrow')) {
        e.preventDefault();
      }

      if (!keysDown.has(key)) {
        keysDown.add(key);
        syncActiveKeys();
        evaluateKeyDrive();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (keysDown.has(key)) {
        keysDown.delete(key);
        syncActiveKeys();
        evaluateKeyDrive();
      }
    };

    const clearAll = () => {
      if (keysDown.size > 0) {
        keysDown.clear();
        syncActiveKeys();
        onSetMotors(0, 0);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearAll);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearAll);
    };
  }, [enabled, speedScale, onSetMotors, onEmergencyStop, onResetPosition, onManualOverride]);

  return activeKeys;
}
