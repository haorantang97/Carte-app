import { useEffect, useRef, useState } from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Sheet } from '@/components/ui/Sheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { useFindCarte, useJoinKitchen, type FoundCarte } from '@/hooks/diner/useJoinKitchen';
import { isValidCarteCode, normalizeCarteCode } from '@/lib/carteCode';
import { palette, noteFont, uiFont } from '@/lib/palette';

interface Props {
  visible: boolean;
  onClose: () => void;
  onJoined?: (carte: FoundCarte) => void;
}

export function JoinKitchenSheet({ visible, onClose, onJoined }: Props) {
  const { t } = useTranslation();
  const findCarte = useFindCarte();
  const join = useJoinKitchen();

  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [needsPin, setNeedsPin] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setCode('');
      setPin('');
      setNeedsPin(null);
    }
  }, [visible]);

  // Debounced pre-flight to detect private carte and show PIN field
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (code.length !== 6) {
      setNeedsPin(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await findCarte.mutateAsync(code);
        setNeedsPin(found?.is_private ?? null);
      } catch {
        setNeedsPin(null);
      }
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const onSubmit = async () => {
    const cleanCode = normalizeCarteCode(code);
    if (!isValidCarteCode(cleanCode)) {
      showToast.error(t('diner.carteCodeNotFound'));
      return;
    }
    setSubmitting(true);
    try {
      const carte = await join.mutateAsync({ code: cleanCode, pin: pin || undefined });
      showToast.success(t('diner.joinedKitchen'), carte.group_name);
      onJoined?.(carte);
      onClose();
    } catch (e: any) {
      const kind = e?.kind as string | undefined;
      if (kind === 'NOT_FOUND') {
        showToast.error(t('diner.carteCodeNotFound'));
      } else if (kind === 'WRONG_PIN') {
        showToast.error(t('diner.wrongPin'));
      } else if (kind === 'PIN_REQUIRED') {
        setNeedsPin(true);
      } else {
        showToast.error(e?.message ?? t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={t('diner.joinMenu')}>
      <View style={{ gap: 14, marginTop: 4 }}>
        <Input
          label={t('diner.carteCodeLabel')}
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
          autoCapitalize="characters"
          maxLength={6}
          autoFocus
          placeholder="ABCDEF"
          style={{
            fontSize: 22,
            textAlign: 'center',
            letterSpacing: 8,
            fontFamily: uiFont,
            fontWeight: '700',
            color: palette.ink,
          }}
          seed={400}
        />

        {needsPin === true ? (
          <Input
            label={t('diner.enterPassword')}
            value={pin}
            onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').slice(0, 8))}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            placeholder="••••"
            seed={401}
          />
        ) : needsPin === false ? (
          <Text
            style={{
              fontFamily: noteFont,
              fontSize: 12,
              color: palette.inkSoft,
              marginTop: -4,
            }}
          >
            {t('diner.publicCarteNoPin')}
          </Text>
        ) : null}

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.cancel')}
              variant="outline"
              fullWidth
              onPress={onClose}
              seed={402}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label={t('common.join')}
              fullWidth
              loading={submitting}
              disabled={code.length !== 6 || (needsPin === true && pin.length === 0)}
              onPress={onSubmit}
              seed={403}
            />
          </View>
        </View>
      </View>
    </Sheet>
  );
}
