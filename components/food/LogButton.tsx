import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useMotion } from '@/components/motion';
import { Button } from '@/components/ui/Button';
import { Stamp } from '@/components/ui/Stamp';
import { Haptic } from '@/constants/motion';

interface LogButtonProps {
  label: string;
  /** Writes to the log. Runs the moment the button is pressed. */
  onLog: () => void;
  /** Leaves the screen. Runs once the stamp has landed. */
  onDone: () => void;
  disabled?: boolean;
}

/** Long enough to see the stamp hit, short enough not to wait on. */
const STAMP_MS = 380;

/**
 * The button that logs food. Pressing it writes the entry at once, a LOGGED
 * stamp thumps down over the button, and then the sheet closes onto the
 * meal card, where the new row is arriving.
 */
export function LogButton({ label, onLog, onDone, disabled = false }: LogButtonProps) {
  const { reduced } = useMotion();
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    if (!logged) return;
    const timer = setTimeout(onDone, reduced ? 0 : STAMP_MS);
    return () => clearTimeout(timer);
    // `onDone` is the caller's latest; a new identity must not restart the wait.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logged, reduced]);

  const press = () => {
    if (logged) return;
    onLog();
    Haptic.log();
    setLogged(true);
  };

  return (
    <View>
      <Button label={label} onPress={press} disabled={disabled || logged} haptic={null} />
      {logged && !reduced ? (
        <View pointerEvents="none" style={styles.stamp}>
          <Stamp label="logged" size={84} thump haptic tilt={-11} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stamp: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
