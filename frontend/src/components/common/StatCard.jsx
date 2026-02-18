import { Paper, Text, Group, ThemeIcon, RingProgress } from '@mantine/core';
import { IconArrowUpRight, IconArrowDownRight, IconQuestionMark } from '@tabler/icons-react';
import { formatCurrency } from '../../utils/formatters';

const GRADIENT_MAP = {
  green: { from: '#43a047', to: '#66bb6a' },
  blue: { from: '#1e88e5', to: '#42a5f5' },
  orange: { from: '#f76707', to: '#ff922b' },
  violet: { from: '#7b1fa2', to: '#ab47bc' },
  red: { from: '#e53935', to: '#ef5350' },
  teal: { from: '#00897b', to: '#26a69a' },
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  color = 'orange',
  isCurrency = false,
  change,
  showRing = false,
  ringValue = 0,
  ringLabel,
  subtitle,
  gradient = false,
}) => {
  const SafeIcon = Icon || IconQuestionMark;
  const displayValue = isCurrency ? formatCurrency(value) : value;
  const isPositiveChange = change > 0;
  const gradientColors = GRADIENT_MAP[color] || GRADIENT_MAP.orange;

  return (
    <Paper
      p="md"
      radius="md"
      withBorder={!gradient}
      style={gradient ? {
        background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`,
        color: '#fff',
      } : undefined}
    >
      <Group justify="space-between" align="flex-start">
        <div>
          <Text size="xs" c={gradient ? 'rgba(255,255,255,0.85)' : 'dimmed'} tt="uppercase" fw={700}>
            {title}
          </Text>
          <Text size="xl" fw={700} mt={4} c={gradient ? '#fff' : undefined}>
            {displayValue}
          </Text>
          {subtitle && (
            <Text size="xs" c={gradient ? 'rgba(255,255,255,0.7)' : 'dimmed'} mt={4}>
              {subtitle}
            </Text>
          )}
          {change !== undefined && (
            <Group gap={4} mt={4}>
              {isPositiveChange ? (
                <IconArrowUpRight size={16} color={gradient ? 'rgba(255,255,255,0.9)' : 'var(--mantine-color-teal-6)'} />
              ) : (
                <IconArrowDownRight size={16} color={gradient ? 'rgba(255,255,255,0.9)' : 'var(--mantine-color-red-6)'} />
              )}
              <Text
                size="xs"
                c={gradient ? 'rgba(255,255,255,0.9)' : (isPositiveChange ? 'teal' : 'red')}
                fw={500}
              >
                {Math.abs(change)}%
              </Text>
            </Group>
          )}
        </div>

        {showRing ? (
          <RingProgress
            size={80}
            thickness={8}
            roundCaps
            sections={[{ value: ringValue, color }]}
            label={
              <Text ta="center" size="xs" fw={700}>
                {ringLabel || `${ringValue}%`}
              </Text>
            }
          />
        ) : (
          <ThemeIcon color={gradient ? 'rgba(255,255,255,0.2)' : color} variant={gradient ? 'filled' : 'light'} size={52} radius="md">
            <SafeIcon size={28} stroke={1.5} color={gradient ? '#fff' : undefined} />
          </ThemeIcon>
        )}
      </Group>
    </Paper>
  );
};

export default StatCard;
