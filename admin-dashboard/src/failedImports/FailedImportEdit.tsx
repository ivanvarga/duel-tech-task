import { useState } from 'react';
import {
  Edit,
  SimpleForm,
  TextInput,
  TextField,
  useRecordContext,
  useNotify,
  useRefresh,
  SaveButton,
  DeleteButton,
  Toolbar,
  Button,
} from 'react-admin';
import { Box, Typography } from '@mui/material';

const RetryButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    if (!record?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/admin/failed-imports/${record.id}/retry`, {
        method: 'POST',
      });

      const result = await response.json();

      if (response.ok) {
        notify(`Success! User ${result.user_id} created`, { type: 'success' });
        refresh();
      } else {
        notify(`Retry failed: ${result.message}`, { type: 'error' });
      }
    } catch (error) {
      notify('Failed to retry import', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      label="Retry Import"
      onClick={handleRetry}
      disabled={loading || record?.status === 'fixed'}
      color="primary"
      variant="contained"
    />
  );
};

const EditToolbar = () => (
  <Toolbar>
    <SaveButton />
    <Box sx={{ ml: 2 }}>
      <RetryButton />
    </Box>
    <Box sx={{ ml: 2 }}>
      <DeleteButton
        mutationMode="pessimistic"
        confirmTitle="Delete Failed Import"
        confirmContent="Are you sure you want to delete this failed import? This will also delete the file from the failed directory."
      />
    </Box>
  </Toolbar>
);

export const FailedImportEdit = () => (
  <Edit mutationMode="pessimistic" redirect={false}>
    <SimpleForm toolbar={<EditToolbar />}>
      <TextField source="file_name" label="File Name" />
      <TextField source="status" />
      <TextField source="error_type" label="Error Type" />
      <TextField source="error_message" label="Error Message" />
      <TextField source="retry_count" label="Retry Count" />

      <Box sx={{ width: '100%', mt: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Raw JSON Data (edit to fix validation issues)
        </Typography>
        <TextInput
          source="raw_data"
          multiline
          fullWidth
          rows={15}
          sx={{
            '& .MuiInputBase-root': {
              fontFamily: 'monospace',
              fontSize: '12px',
            },
          }}
        />
      </Box>

      <TextInput source="notes" multiline fullWidth rows={3} />
    </SimpleForm>
  </Edit>
);
