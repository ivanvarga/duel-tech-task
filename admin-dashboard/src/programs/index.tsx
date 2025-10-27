import { List, Datagrid, TextField } from 'react-admin';

export const ProgramList = () => (
  <List exporter={false}>
    <Datagrid bulkActionButtons={false}>
      <TextField source="program_id" label="Program ID" />
      <TextField source="brand_id" label="Brand ID" />
    </Datagrid>
  </List>
);
