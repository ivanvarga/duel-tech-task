import {
  List,
  Datagrid,
  TextField,
  DateField,
  SelectInput,
  TextInput,
  FunctionField,
  ChipField,
  BulkDeleteButton,
} from 'react-admin';

const failedImportFilters = [
  <TextInput key="q" label="Search" source="q" alwaysOn />,
  <SelectInput
    key="status"
    source="status"
    label="Status"
    choices={[
      { id: 'failed', name: 'Failed' },
      { id: 'retrying', name: 'Retrying' },
      { id: 'fixed', name: 'Fixed' },
      { id: 'ignored', name: 'Ignored' },
    ]}
  />,
  <SelectInput
    key="error_type"
    source="error_type"
    label="Error Type"
    choices={[
      { id: 'parse_error', name: 'Parse Error' },
      { id: 'validation_error', name: 'Validation Error' },
    ]}
  />,
];

const FailedImportBulkActions = () => (
  <>
    <BulkDeleteButton
      confirmTitle="Delete Failed Imports"
      confirmContent="Are you sure you want to delete these failed imports? This will also delete the files from the failed directory."
      mutationMode="pessimistic"
    />
  </>
);

export const FailedImportList = () => (
  <List filters={failedImportFilters} perPage={25} sort={{ field: 'attempted_at', order: 'DESC' }} exporter={false}>
    <Datagrid rowClick="edit" bulkActionButtons={<FailedImportBulkActions />}>
      <TextField source="file_name" label="File Name" />
      <ChipField source="status" />
      <TextField source="error_type" label="Error Type" />
      <FunctionField
        label="Error Message"
        render={(record: any) => {
          const msg = record.error_message || '';
          return msg.length > 60 ? msg.substring(0, 60) + '...' : msg;
        }}
      />
      <TextField source="retry_count" label="Retries" />
      <DateField source="attempted_at" label="Attempted" showTime />
      <DateField source="last_retry_at" label="Last Retry" showTime />
    </Datagrid>
  </List>
);
