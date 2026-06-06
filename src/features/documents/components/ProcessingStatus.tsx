import React from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Chip,
  Paper,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  RadioButtonUnchecked,
  HourglassEmpty,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

export type ProcessingStep =
  | 'upload'
  | 'parse'
  | 'chunk'
  | 'embed'
  | 'extract'
  | 'classify'
  | 'done';

export interface ProcessingStepStatus {
  step: ProcessingStep;
  status: 'pending' | 'active' | 'done' | 'error';
  message?: string;
  duration?: number;
}

const STEP_LABELS: Record<ProcessingStep, string> = {
  upload: 'Upload',
  parse: 'Parse Document',
  chunk: 'Chunking',
  embed: 'Embedding',
  extract: 'AI Extraction',
  classify: 'Classification',
  done: 'Complete',
};

interface ProcessingStatusProps {
  steps: ProcessingStepStatus[];
  compact?: boolean;
}

const StepIcon: React.FC<{ status: ProcessingStepStatus['status'] }> = ({ status }) => {
  switch (status) {
    case 'done':
      return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
    case 'error':
      return <ErrorIcon sx={{ color: 'error.main', fontSize: 20 }} />;
    case 'active':
      return <CircularProgress size={20} thickness={5} />;
    default:
      return <RadioButtonUnchecked sx={{ color: 'text.disabled', fontSize: 20 }} />;
  }
};

const defaultSteps: ProcessingStepStatus[] = [
  { step: 'upload', status: 'done', duration: 1.2 },
  { step: 'parse', status: 'done', duration: 3.4 },
  { step: 'chunk', status: 'done', duration: 0.8 },
  { step: 'embed', status: 'active', message: 'Generating embeddings...' },
  { step: 'extract', status: 'pending' },
  { step: 'classify', status: 'pending' },
  { step: 'done', status: 'pending' },
];

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  steps = defaultSteps,
  compact = false,
}) => {
  const activeStep = steps.findIndex((s) => s.status === 'active' || s.status === 'pending');
  const hasError = steps.some((s) => s.status === 'error');
  const allDone = steps.every((s) => s.status === 'done');

  if (compact) {
    const currentStep = steps.find((s) => s.status === 'active');
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {allDone ? (
          <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
        ) : hasError ? (
          <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
        ) : (
          <CircularProgress size={16} thickness={5} />
        )}
        <Typography variant="caption" color="text.secondary">
          {allDone
            ? 'Processing complete'
            : hasError
            ? 'Processing failed'
            : currentStep
            ? STEP_LABELS[currentStep.step]
            : 'Queued'}
        </Typography>
      </Box>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{ p: 2.5, borderRadius: 2 }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          Processing Status
        </Typography>
        <Chip
          label={allDone ? 'Complete' : hasError ? 'Failed' : 'Processing'}
          size="small"
          color={allDone ? 'success' : hasError ? 'error' : 'primary'}
        />
      </Box>

      <Stepper orientation="vertical" activeStep={activeStep} nonLinear>
        {steps.map((s, index) => (
          <Step key={s.step} completed={s.status === 'done'}>
            <StepLabel
              StepIconComponent={() => <StepIcon status={s.status} />}
              sx={{ '& .MuiStepLabel-labelContainer': { ml: 1 } }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={s.status === 'active' ? 600 : 400}
                  color={s.status === 'active' ? 'primary.main' : s.status === 'error' ? 'error.main' : undefined}
                >
                  {STEP_LABELS[s.step]}
                </Typography>
                {s.status === 'active' && (
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <HourglassEmpty sx={{ fontSize: 14, color: 'primary.main' }} />
                  </motion.div>
                )}
                {s.duration && s.status === 'done' && (
                  <Typography variant="caption" color="text.disabled">
                    {s.duration}s
                  </Typography>
                )}
              </Box>
              {s.message && s.status === 'active' && (
                <Typography variant="caption" color="text.secondary">
                  {s.message}
                </Typography>
              )}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Paper>
  );
};

export default ProcessingStatus;
