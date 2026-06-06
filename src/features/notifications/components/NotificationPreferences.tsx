import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  Button,
  Stack,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { put } from '@api/client';
import { useUIStore } from '@store/uiStore';

// ── Types ─────────────────────────────────────────────────────────────────────

interface NotificationCategory {
  key: string;
  label: string;
  description: string;
}

const CATEGORIES: NotificationCategory[] = [
  {
    key: 'requirementsChanges',
    label: 'Requirements Changes',
    description: 'When requirements are created, updated, or deleted',
  },
  {
    key: 'epicUpdates',
    label: 'Epic Updates',
    description: 'Status changes and new stories added to epics',
  },
  {
    key: 'storyAssignments',
    label: 'Story Assignments',
    description: 'When stories are assigned to or from you',
  },
  {
    key: 'sprintChanges',
    label: 'Sprint Changes',
    description: 'Sprint started, completed, or stories moved',
  },
  {
    key: 'approvalRequests',
    label: 'Approval Requests',
    description: 'When approval is requested or a decision is made',
  },
  {
    key: 'aiGenerationComplete',
    label: 'AI Generation Complete',
    description: 'When AI finishes generating requirements or stories',
  },
  {
    key: 'systemAlerts',
    label: 'System Alerts',
    description: 'Maintenance windows, downtime, and platform announcements',
  },
];

type DigestFrequency = 'realtime' | 'daily' | 'weekly';

interface PreferencesState {
  categories: Record<string, boolean>;
  emailDigest: DigestFrequency;
}

const DEFAULT_PREFERENCES: PreferencesState = {
  categories: Object.fromEntries(CATEGORIES.map((c) => [c.key, true])),
  emailDigest: 'realtime',
};

interface NotificationPreferencesProps {
  open: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationPreferences({ open, onClose }: NotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<PreferencesState>(DEFAULT_PREFERENCES);
  const toast = useUIStore((s) => s.toast);

  const saveMutation = useMutation({
    mutationFn: () =>
      put('/notifications/preferences', {
        categories: prefs.categories,
        emailDigest: prefs.emailDigest,
      }),
    onSuccess: () => {
      toast.success('Notification preferences saved');
      onClose();
    },
    onError: () => {
      toast.error('Failed to save preferences. Please try again.');
    },
  });

  function handleCategoryToggle(key: string, checked: boolean) {
    setPrefs((prev) => ({
      ...prev,
      categories: { ...prev.categories, [key]: checked },
    }));
  }

  function handleDigestChange(value: DigestFrequency) {
    setPrefs((prev) => ({ ...prev, emailDigest: value }));
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 380, p: 0 } }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Notification Preferences
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
        {/* Category toggles */}
        <Typography variant="subtitle2" fontWeight={600} mb={1.5} color="text.secondary">
          NOTIFICATION CATEGORIES
        </Typography>
        <Stack spacing={0.5}>
          {CATEGORIES.map((cat) => (
            <Box
              key={cat.key}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                py: 1,
                px: 1.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {cat.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {cat.description}
                </Typography>
              </Box>
              <Switch
                checked={prefs.categories[cat.key] ?? true}
                onChange={(_, checked) => handleCategoryToggle(cat.key, checked)}
                size="small"
                color="primary"
              />
            </Box>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Email digest frequency */}
        <FormControl component="fieldset">
          <FormLabel component="legend">
            <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
              EMAIL DIGEST FREQUENCY
            </Typography>
          </FormLabel>
          <RadioGroup
            value={prefs.emailDigest}
            onChange={(e) => handleDigestChange(e.target.value as DigestFrequency)}
            sx={{ mt: 1 }}
          >
            {(
              [
                { value: 'realtime', label: 'Realtime', desc: 'Email for every notification' },
                { value: 'daily', label: 'Daily Digest', desc: 'One email per day at 9 AM' },
                { value: 'weekly', label: 'Weekly Digest', desc: 'One email every Monday morning' },
              ] as { value: DigestFrequency; label: string; desc: string }[]
            ).map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={opt.value}
                control={<Radio size="small" />}
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={500}>
                      {opt.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {opt.desc}
                    </Typography>
                  </Box>
                }
                sx={{ mb: 0.5, alignItems: 'flex-start', '& .MuiRadio-root': { pt: 0.5 } }}
              />
            ))}
          </RadioGroup>
        </FormControl>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          onClick={onClose}
          disabled={saveMutation.isPending}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          fullWidth
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          startIcon={saveMutation.isPending ? <CircularProgress size={14} /> : undefined}
        >
          Save Preferences
        </Button>
      </Box>
    </Drawer>
  );
}

export default NotificationPreferences;
