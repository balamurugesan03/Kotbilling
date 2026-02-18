import { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  TextInput,
  Switch,
  NumberInput,
  Button,
  CopyButton,
  ActionIcon,
  Tooltip,
  Divider,
} from '@mantine/core';
import {
  IconCheck,
  IconCopy,
  IconPlugConnected,
  IconPlugConnectedX,
  IconTestPipe,
} from '@tabler/icons-react';
import { AGGREGATOR_STATUS_COLORS, WEBHOOK_BASE_URL } from '../../utils/constants';

const AggregatorCard = ({ platform, config, onSave, onTest, isSaving, isTesting }) => {
  const [formData, setFormData] = useState({
    isEnabled: config?.isEnabled || false,
    apiKey: '',
    apiSecret: '',
    storeId: config?.storeId || '',
    webhookSecret: '',
    autoAccept: config?.autoAccept || false,
    defaultPrepTime: config?.defaultPrepTime || 20,
    platformBaseUrl: config?.platformBaseUrl || '',
  });

  const webhookUrl = `${WEBHOOK_BASE_URL}/aggregator/webhook/${platform}`;
  const connectionStatus = config?.connectionStatus || 'disconnected';
  const platformLabel = platform === 'swiggy' ? 'Swiggy' : 'Zomato';
  const platformColor = platform === 'swiggy' ? 'orange' : 'red';

  const handleSave = () => {
    const saveData = { ...formData };
    // Only send credentials if they were changed (non-empty)
    if (!saveData.apiKey) delete saveData.apiKey;
    if (!saveData.apiSecret) delete saveData.apiSecret;
    if (!saveData.webhookSecret) delete saveData.webhookSecret;
    onSave(platform, saveData);
  };

  return (
    <Paper p="lg" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group>
            <Title order={4}>{platformLabel}</Title>
            <Badge
              color={AGGREGATOR_STATUS_COLORS[connectionStatus]}
              variant="light"
              leftSection={
                connectionStatus === 'connected'
                  ? <IconPlugConnected size={12} />
                  : <IconPlugConnectedX size={12} />
              }
            >
              {connectionStatus}
            </Badge>
          </Group>
          <Switch
            label="Enabled"
            checked={formData.isEnabled}
            onChange={(e) => setFormData({ ...formData, isEnabled: e.currentTarget.checked })}
            color={platformColor}
          />
        </Group>

        <Divider />

        <TextInput
          label="API Key"
          placeholder={config?.apiKey || 'Enter API key'}
          value={formData.apiKey}
          onChange={(e) => setFormData({ ...formData, apiKey: e.currentTarget.value })}
          description={config?.apiKey ? `Current: ${config.apiKey}` : 'Not set'}
        />

        <TextInput
          label="API Secret"
          placeholder="Enter API secret"
          type="password"
          value={formData.apiSecret}
          onChange={(e) => setFormData({ ...formData, apiSecret: e.currentTarget.value })}
          description="Hidden for security"
        />

        <TextInput
          label="Store ID"
          placeholder="Enter store/restaurant ID"
          value={formData.storeId}
          onChange={(e) => setFormData({ ...formData, storeId: e.currentTarget.value })}
        />

        <TextInput
          label="Webhook Secret"
          placeholder="Enter webhook secret for HMAC verification"
          type="password"
          value={formData.webhookSecret}
          onChange={(e) => setFormData({ ...formData, webhookSecret: e.currentTarget.value })}
          description="Used to verify incoming webhook signatures"
        />

        <TextInput
          label="Platform Base URL"
          placeholder="https://partner-api.swiggy.com"
          value={formData.platformBaseUrl}
          onChange={(e) => setFormData({ ...formData, platformBaseUrl: e.currentTarget.value })}
          description="Base URL for platform partner API"
        />

        <Divider />

        <Group>
          <Text size="sm" fw={500}>Webhook URL:</Text>
          <Text size="sm" c="dimmed" style={{ wordBreak: 'break-all' }}>{webhookUrl}</Text>
          <CopyButton value={webhookUrl}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy'}>
                <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>

        <Divider />

        <Switch
          label="Auto-accept orders"
          description="Automatically accept incoming orders and notify platform"
          checked={formData.autoAccept}
          onChange={(e) => setFormData({ ...formData, autoAccept: e.currentTarget.checked })}
          color={platformColor}
        />

        <NumberInput
          label="Default Preparation Time (minutes)"
          value={formData.defaultPrepTime}
          onChange={(val) => setFormData({ ...formData, defaultPrepTime: val })}
          min={5}
          max={120}
          step={5}
        />

        <Group justify="flex-end">
          <Button
            variant="outline"
            leftSection={<IconTestPipe size={16} />}
            onClick={() => onTest(platform)}
            loading={isTesting}
          >
            Test Connection
          </Button>
          <Button
            color={platformColor}
            onClick={handleSave}
            loading={isSaving}
          >
            Save Configuration
          </Button>
        </Group>
      </Stack>
    </Paper>
  );
};

export default AggregatorCard;
