import { SimpleGrid, Button, Paper, TextInput, ActionIcon, Group } from '@mantine/core';
import { IconBackspace, IconX } from '@tabler/icons-react';
import { useState, useEffect, useRef, useCallback } from 'react';

const NumPad = ({
  value = '',
  onChange,
  onSubmit,
  maxLength = 10,
  placeholder = 'Enter amount',
  allowDecimal = true,
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const updateValue = useCallback((newValue) => {
    setDisplayValue(newValue);
    onChange?.(newValue);
  }, [onChange]);

  const handlePress = (digit) => {
    if (displayValue.length >= maxLength) return;
    if (digit === '.' && !allowDecimal) return;
    if (digit === '.' && displayValue.includes('.')) return;

    updateValue(displayValue + digit);
  };

  const handleBackspace = () => {
    updateValue(displayValue.slice(0, -1));
  };

  const handleClear = () => {
    updateValue('');
  };

  const handleSubmit = () => {
    onSubmit?.(displayValue);
  };

  // Physical keyboard support
  const handleKeyDown = (e) => {
    // Number keys (0-9)
    if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      handlePress(e.key);
      return;
    }

    // Decimal point
    if (e.key === '.' || e.key === 'Decimal') {
      e.preventDefault();
      handlePress('.');
      return;
    }

    // Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
      return;
    }

    // Delete = clear all
    if (e.key === 'Delete') {
      e.preventDefault();
      handleClear();
      return;
    }

    // Enter = submit (if onSubmit provided)
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      handleSubmit();
      return;
    }
  };

  const buttons = [
    '7', '8', '9',
    '4', '5', '6',
    '1', '2', '3',
    allowDecimal ? '.' : '00', '0', 'back',
  ];

  return (
    <Paper p="md" withBorder>
      <Group mb="md">
        <TextInput
          ref={inputRef}
          flex={1}
          value={displayValue}
          placeholder={placeholder}
          readOnly
          size="lg"
          onKeyDown={handleKeyDown}
          styles={{
            input: {
              textAlign: 'right',
              fontSize: '1.5rem',
              fontWeight: 600,
              caretColor: 'transparent',
            },
          }}
        />
        <ActionIcon size="xl" variant="light" color="red" onClick={handleClear} tabIndex={-1}>
          <IconX size={20} />
        </ActionIcon>
      </Group>

      <SimpleGrid cols={3} spacing="xs">
        {buttons.map((btn) => {
          if (btn === 'back') {
            return (
              <Button
                key={btn}
                variant="light"
                color="gray"
                size="lg"
                onClick={handleBackspace}
                tabIndex={-1}
              >
                <IconBackspace size={24} />
              </Button>
            );
          }
          return (
            <Button
              key={btn}
              variant="light"
              size="lg"
              onClick={() => handlePress(btn)}
              tabIndex={-1}
            >
              {btn}
            </Button>
          );
        })}
      </SimpleGrid>

      {onSubmit && (
        <Button
          fullWidth
          size="lg"
          mt="md"
          onClick={handleSubmit}
          disabled={!displayValue}
          tabIndex={-1}
        >
          Submit
        </Button>
      )}
    </Paper>
  );
};

export default NumPad;
