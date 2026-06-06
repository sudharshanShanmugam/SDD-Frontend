import React, { useState } from 'react';
import {
  Box, Typography, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, IconButton, Grid,
} from '@mui/material';
import { Add, Close, AutoAwesome, BugReport } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { qaApi } from '@/api';
import TestCaseTable, { TestCase } from '../components/TestCaseTable';
import TestCoverage from '../components/TestCoverage';
import GeneratedTests from '../components/GeneratedTests';
import TestCaseEditor from '../components/TestCaseEditor';
import type { TestStep } from '../components/TestSteps';

const QADashboardPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editTest, setEditTest] = useState<TestCase | null>(null);

  const { data } = useQuery({
    queryKey: ['test-cases', projectId],
    queryFn: () => qaApi.listTestCases(projectId!),
    enabled: !!projectId,
  });
  const testCases: TestCase[] = (data?.data ?? []) as unknown as TestCase[];

  const { mutateAsync: createTestCase } = useMutation({
    mutationFn: (caseData: Partial<TestCase>) =>
      qaApi.createTestCase(projectId!, caseData as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });

  const { mutateAsync: updateTestCase } = useMutation({
    mutationFn: ({ id, caseData }: { id: string; caseData: Partial<TestCase> }) =>
      qaApi.updateTestCase(id, caseData as never),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });

  const { mutate: deleteTestCase } = useMutation({
    mutationFn: (id: string) => qaApi.deleteTestCase(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['test-cases', projectId] }),
  });

  const handleSave = async (data: Partial<TestCase> & { steps: TestStep[] }) => {
    if (editTest) {
      await updateTestCase({ id: editTest.id, caseData: data });
    } else {
      await createTestCase(data);
    }
    setFormOpen(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <BugReport color="primary" />
              <Typography variant="h4" fontWeight={700}>QA Intelligence</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              AI-powered test generation and quality assurance dashboard
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AutoAwesome />}
              sx={{ borderRadius: 2 }}
            >
              Generate Tests (AI)
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => { setEditTest(null); setFormOpen(true); }}
              sx={{ borderRadius: 2 }}
            >
              New Test Case
            </Button>
          </Box>
        </Box>
      </motion.div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="Test Cases" />
          <Tab label="Coverage" />
          <Tab label="Generated Tests" />
        </Tabs>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {activeTab === 0 && (
          <TestCaseTable
            tests={testCases}
            onEdit={(t) => { setEditTest(t); setFormOpen(true); }}
            onDelete={(id) => deleteTestCase(id)}
            onRun={(t) => {
              // Create a test run for this single test case
              if (projectId) {
                void qaApi.createTestRun(projectId, [t.id], `Run: ${t.title}`, 'development')
                  .then((run: { id: string }) => qaApi.executeTestRun(run.id))
                  .catch(() => {});
              }
            }}
          />
        )}
        {activeTab === 1 && (
          <Box sx={{ overflowY: 'auto', height: '100%', pr: 1 }}>
            <TestCoverage />
          </Box>
        )}
        {activeTab === 2 && (
          <Box sx={{ overflowY: 'auto', height: '100%', pr: 1 }}>
            <GeneratedTests onGenerateMore={async () => {}} />
          </Box>
        )}
      </Box>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
          {editTest ? 'Edit Test Case' : 'Create Test Case'}
          <IconButton onClick={() => setFormOpen(false)}><Close /></IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <TestCaseEditor testCase={editTest} onSave={handleSave} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default QADashboardPage;
