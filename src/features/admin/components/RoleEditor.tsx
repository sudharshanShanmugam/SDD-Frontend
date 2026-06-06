import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Button,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Divider,
  Tooltip,
  Grid,
} from '@mui/material';
import { Add, Edit, Delete, Security, Lock } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Permission {
  id: string;
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete' | 'admin')[];
}

interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Permission[];
  userCount: number;
}

const RESOURCES = ['documents', 'requirements', 'epics', 'stories', 'sprints', 'tasks', 'approvals', 'qa', 'users', 'settings'];
const ACTIONS: Permission['actions'][0][] = ['create', 'read', 'update', 'delete', 'admin'];
const ACTION_COLORS: Record<string, string> = { create: '#10b981', read: '#3b82f6', update: '#f59e0b', delete: '#ef4444', admin: '#8b5cf6' };

const RoleEditor: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const handleEditRole = () => {
    if (!selectedRole) return;
    setEditName(selectedRole.name);
    setEditDescription(selectedRole.description);
    setEditDialogOpen(true);
  };

  const handleSaveRole = () => {
    if (!selectedRole) return;
    setRoles((prev) => prev.map((r) => r.id === selectedRole.id ? { ...r, name: editName, description: editDescription } : r));
    setSelectedRole((prev) => prev ? { ...prev, name: editName, description: editDescription } : prev);
    setEditDialogOpen(false);
  };

  const togglePermission = (resource: string, action: Permission['actions'][0]) => {
    if (!selectedRole || selectedRole.isSystem) return;
    const updated = { ...selectedRole };
    const perm = updated.permissions.find((p) => p.resource === resource);
    if (perm) {
      if (perm.actions.includes(action)) {
        perm.actions = perm.actions.filter((a) => a !== action);
      } else {
        perm.actions = [...perm.actions, action];
      }
    } else {
      updated.permissions = [...updated.permissions, { id: `p-${Date.now()}`, resource, actions: [action] }];
    }
    setSelectedRole(updated);
    setRoles((prev) => prev.map((r) => r.id === updated.id ? updated : r));
  };

  const hasPermission = (resource: string, action: Permission['actions'][0]) => {
    return selectedRole?.permissions.some((p) => p.resource === resource && p.actions.includes(action)) ?? false;
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      {/* Roles List */}
      <Paper variant="outlined" sx={{ width: 240, flexShrink: 0, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={600}>Roles</Typography>
          <IconButton size="small"><Add fontSize="small" /></IconButton>
        </Box>
        <List dense disablePadding>
          {roles.map((role) => (
            <ListItem
              key={role.id}
              button
              selected={selectedRole?.id === role.id}
              onClick={() => setSelectedRole(role)}
              sx={{ py: 1.5 }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{role.name}</Typography>
                    {role.isSystem && <Lock sx={{ fontSize: 12, color: 'text.disabled' }} />}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <Chip label={`${role.userCount} users`} size="small" sx={{ height: 16, fontSize: '0.6rem' }} />
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* Permissions Matrix */}
      <Box sx={{ flex: 1 }}>
        {!selectedRole ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" color="text.secondary">Select a role to view permissions</Typography>
          </Box>
        ) : (
        <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="primary" />
              <Typography variant="h6" fontWeight={700}>{selectedRole.name}</Typography>
              {selectedRole.isSystem && <Chip label="System" size="small" variant="outlined" sx={{ height: 20 }} />}
            </Box>
            <Typography variant="body2" color="text.secondary">{selectedRole.description}</Typography>
          </Box>
          {!selectedRole.isSystem && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="outlined" startIcon={<Edit />} onClick={handleEditRole} size="small" sx={{ borderRadius: 2 }}>Edit</Button>
              <Button variant="outlined" color="error" startIcon={<Delete />} size="small" sx={{ borderRadius: 2 }}>Delete</Button>
            </Box>
          )}
        </Box>

        <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'auto' }}>
          <Box sx={{ minWidth: 500 }}>
            {/* Header */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '160px repeat(5, 1fr)', bgcolor: 'action.hover', p: 1.5 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary">RESOURCE</Typography>
              {ACTIONS.map((a) => (
                <Box key={a} sx={{ textAlign: 'center' }}>
                  <Chip label={a} size="small" sx={{ height: 18, fontSize: '0.6rem', bgcolor: ACTION_COLORS[a] + '22', color: ACTION_COLORS[a] }} />
                </Box>
              ))}
            </Box>
            <Divider />
            {RESOURCES.map((resource, i) => (
              <Box
                key={resource}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '160px repeat(5, 1fr)',
                  p: 1.25,
                  bgcolor: i % 2 === 0 ? 'background.paper' : 'action.hover' + '44',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>{resource}</Typography>
                {ACTIONS.map((action) => (
                  <Box key={action} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Tooltip title={selectedRole.isSystem ? 'System roles cannot be modified' : `Toggle ${action} on ${resource}`}>
                      <Switch
                        size="small"
                        checked={hasPermission(resource, action)}
                        onChange={() => togglePermission(resource, action)}
                        disabled={selectedRole.isSystem}
                        sx={{ '& .Mui-checked': { color: ACTION_COLORS[action] } }}
                      />
                    </Tooltip>
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Paper>
        </Box>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Edit Role</DialogTitle>
        <DialogContent>
          <TextField label="Role Name" value={editName} onChange={(e) => setEditName(e.target.value)} fullWidth sx={{ mb: 2, mt: 1 }} />
          <TextField label="Description" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} fullWidth multiline rows={2} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button onClick={handleSaveRole} variant="contained" sx={{ borderRadius: 2 }}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RoleEditor;
