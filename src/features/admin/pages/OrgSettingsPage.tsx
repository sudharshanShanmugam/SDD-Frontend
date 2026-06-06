import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
} from '@mui/material';
import { Save, Business, Security, AutoAwesome, Notifications } from '@mui/icons-material';
import { motion } from 'framer-motion';

const OrgSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [orgName, setOrgName] = useState('Acme Corp');
  const [orgSlug, setOrgSlug] = useState('acme-corp');
  const [orgIndustry, setOrgIndustry] = useState('Technology');
  const [defaultModel, setDefaultModel] = useState('gpt-4o');
  const [maxTokens, setMaxTokens] = useState('4096');
  const [requireApprovals, setRequireApprovals] = useState(true);
  const [aiAutoRun, setAiAutoRun] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const handleSave = () => {
    setSuccess('Settings saved successfully');
    setTimeout(() => setSuccess(null), 3000);
  };

  const tabs = [
    { label: 'General', icon: <Business fontSize="small" /> },
    { label: 'AI Settings', icon: <AutoAwesome fontSize="small" /> },
    { label: 'Security', icon: <Security fontSize="small" /> },
    { label: 'Notifications', icon: <Notifications fontSize="small" /> },
  ];

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>Organization Settings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure your organization's preferences and AI pipeline settings
        </Typography>
      </motion.div>

      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}>
          {tabs.map((t) => (
            <Tab key={t.label} label={t.label} icon={t.icon} iconPosition="start" sx={{ minHeight: 48 }} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField label="Organization Name" value={orgName} onChange={(e) => setOrgName(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Organization Slug"
                  value={orgSlug}
                  onChange={(e) => setOrgSlug(e.target.value)}
                  fullWidth
                  helperText="Used in URLs and API references"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Industry" value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Website" placeholder="https://example.com" fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Description" multiline rows={3} fullWidth placeholder="Brief description of your organization..." />
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Default AI Model</InputLabel>
                  <Select value={defaultModel} label="Default AI Model" onChange={(e) => setDefaultModel(e.target.value)}>
                    {['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'].map((m) => (
                      <MenuItem key={m} value={m}>{m}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Tokens per Request"
                  type="number"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                  fullWidth
                  inputProps={{ min: 100, max: 128000 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>Pipeline Settings</Typography>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={requireApprovals} onChange={(e) => setRequireApprovals(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Require human approval at each stage</Typography>
                      <Typography variant="caption" color="text.secondary">AI artifacts require approval before advancing in the pipeline</Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={aiAutoRun} onChange={(e) => setAiAutoRun(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Auto-run AI pipeline after document upload</Typography>
                      <Typography variant="caption" color="text.secondary">
                        <Chip label="Recommended: OFF" size="small" color="warning" sx={{ height: 18, fontSize: '0.65rem' }} />
                        {' '} Automatically trigger requirement extraction on upload
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Require MFA for all users</Typography>
                      <Typography variant="caption" color="text.secondary">Enforce multi-factor authentication organization-wide</Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Audit log all AI operations</Typography>
                      <Typography variant="caption" color="text.secondary">Keep detailed logs of all AI prompts and outputs</Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Session Timeout (minutes)"
                  type="number"
                  defaultValue={60}
                  fullWidth
                  inputProps={{ min: 5, max: 1440 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>SSO Provider</InputLabel>
                  <Select defaultValue="none" label="SSO Provider">
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="google">Google Workspace</MenuItem>
                    <MenuItem value="microsoft">Microsoft Azure AD</MenuItem>
                    <MenuItem value="okta">Okta</MenuItem>
                    <MenuItem value="saml">Custom SAML</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}

          {activeTab === 3 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={<Switch checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Email notifications</Typography>
                      <Typography variant="caption" color="text.secondary">Send email alerts for approvals, mentions, and important events</Typography>
                    </Box>
                  }
                />
              </Grid>
              {['AI pipeline completion', 'Approval requests', 'Sprint planning reminders', 'Bug reports', 'System updates'].map((item) => (
                <Grid item xs={12} key={item}>
                  <FormControlLabel
                    control={<Switch defaultChecked={item !== 'System updates'} />}
                    label={<Typography variant="body2">{item}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          )}

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{ borderRadius: 2 }}
            >
              Save Settings
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default OrgSettingsPage;
