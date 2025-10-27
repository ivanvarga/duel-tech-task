import { Card, CardContent, CardHeader, Button, Typography, Box, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SyncIcon from '@mui/icons-material/Sync';

const API_BASE_URL = 'http://localhost:3000';

interface WorkerParam {
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
}

interface Worker {
  name: string;
  description: string;
  endpoint: string;
  key: string;
  params?: WorkerParam[];
}

export const WorkerDashboard = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<{ [key: string]: { success: boolean; message: string } }>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [paramValues, setParamValues] = useState<{ [key: string]: string }>({});

  const triggerWorker = async (worker: Worker, params?: any) => {
    setLoading(worker.key);
    setResults(prev => ({ ...prev, [worker.key]: { success: false, message: 'Running...' } }));

    try {
      const response = await fetch(`${API_BASE_URL}${worker.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      });

      const data = await response.json();

      if (response.ok) {
        setResults(prev => ({
          ...prev,
          [worker.key]: { success: true, message: data.message || JSON.stringify(data) || 'Success!' }
        }));
      } else {
        setResults(prev => ({
          ...prev,
          [worker.key]: { success: false, message: data.error || data.message || 'Failed' }
        }));
      }
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [worker.key]: { success: false, message: error.message || 'Error' }
      }));
    } finally {
      setLoading(null);
    }
  };

  const handleRunClick = (worker: Worker) => {
    if (worker.params && worker.params.length > 0) {
      setSelectedWorker(worker);
      setParamValues({});
      setDialogOpen(true);
    } else {
      triggerWorker(worker);
    }
  };

  const handleDialogRun = () => {
    if (selectedWorker) {
      triggerWorker(selectedWorker, paramValues);
      setDialogOpen(false);
    }
  };

  const workers: Worker[] = [
    {
      name: 'Extract Files',
      description: 'Extract data.tar.gz from project root, clean database + files directory',
      endpoint: '/api/admin/workers/extract',
      key: 'extract'
    },
    {
      name: 'ETL Pipeline',
      description: 'Process all JSON files and import data into database',
      endpoint: '/api/worker/etl/run',
      key: 'etl'
    },
    {
      name: 'Process Single File',
      description: 'Process a specific JSON file',
      endpoint: '/api/worker/process-file',
      key: 'process-file',
      params: [
        {
          name: 'file_name',
          label: 'File Name',
          required: true,
          placeholder: 'e.g., user_1.json'
        }
      ]
    }
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Worker Management
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Trigger background workers and ETL jobs from this dashboard.
      </Typography>

      <Box sx={{ display: 'grid', gap: 2, mt: 3 }}>
        {workers.map((worker) => (
          <Card key={worker.key}>
            <CardHeader
              title={worker.name}
              subheader={worker.description}
              action={
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={loading === worker.key ? <SyncIcon className="spin" /> : <PlayArrowIcon />}
                  onClick={() => handleRunClick(worker)}
                  disabled={loading !== null}
                >
                  {loading === worker.key ? 'Running...' : 'Run'}
                </Button>
              }
            />
            <CardContent>
              {results[worker.key] && (
                <Alert severity={results[worker.key].success ? 'success' : 'error'}>
                  {results[worker.key].message}
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </Box>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedWorker?.name} - Parameters</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            {selectedWorker?.params?.map((param) => (
              <TextField
                key={param.name}
                label={param.label}
                placeholder={param.placeholder}
                required={param.required}
                fullWidth
                value={paramValues[param.name] || ''}
                onChange={(e) => setParamValues(prev => ({ ...prev, [param.name]: e.target.value }))}
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDialogRun}
            variant="contained"
            color="primary"
            disabled={selectedWorker?.params?.some(p => p.required && !paramValues[p.name])}
          >
            Run
          </Button>
        </DialogActions>
      </Dialog>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </Box>
  );
};
