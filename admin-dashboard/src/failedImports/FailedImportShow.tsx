import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  FunctionField,
  DeleteButton,
  TopToolbar,
} from 'react-admin';
import { Box, Typography } from '@mui/material';

const ShowActions = () => (
  <TopToolbar>
    <DeleteButton
      mutationMode="pessimistic"
      confirmTitle="Delete Failed Import"
      confirmContent="Are you sure you want to delete this failed import? This will also delete the file from the failed directory."
    />
  </TopToolbar>
);

export const FailedImportShow = () => (
  <Show actions={<ShowActions />}>
    <SimpleShowLayout>
      <TextField source="file_name" label="File Name" />
      <TextField source="file_path" label="File Path" />
      <TextField source="status" />
      <TextField source="error_type" label="Error Type" />
      <TextField source="error_message" label="Error Message" />
      <TextField source="retry_count" label="Retry Count" />
      <DateField source="attempted_at" label="Attempted At" showTime />
      <DateField source="last_retry_at" label="Last Retry At" showTime />
      <DateField source="fixed_at" label="Fixed At" showTime />

      <FunctionField
        label="Raw JSON Data"
        render={(record: any) => {
          try {
            const formatted = JSON.stringify(JSON.parse(record.raw_data), null, 2);
            return (
              <Box
                sx={{
                  backgroundColor: '#f5f5f5',
                  padding: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: '400px',
                }}
              >
                {formatted}
              </Box>
            );
          } catch {
            return (
              <Box
                sx={{
                  backgroundColor: '#fff3cd',
                  padding: 2,
                  borderRadius: 1,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  overflow: 'auto',
                  maxHeight: '400px',
                }}
              >
                <Typography color="error" gutterBottom>
                  Invalid JSON (cannot parse)
                </Typography>
                {record.raw_data}
              </Box>
            );
          }
        }}
      />

      <TextField source="notes" label="Notes" />
      <DateField source="createdAt" label="Created At" showTime />
      <DateField source="updatedAt" label="Updated At" showTime />
    </SimpleShowLayout>
  </Show>
);
