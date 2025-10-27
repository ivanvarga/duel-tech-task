import { List, Datagrid, TextField, DateField, NumberField, Edit, SimpleForm, TextInput, NumberInput, Show, SimpleShowLayout } from 'react-admin';

export const ProgramMembershipList = () => (
  <List exporter={false}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="membership_id" label="Membership ID" />
      <TextField source="user_id" label="User ID" />
      <TextField source="program_id" label="Program ID" />
      <NumberField source="tasks_completed" label="Tasks" />
      <NumberField source="sales_attributed" label="Sales" options={{ style: 'currency', currency: 'USD' }} />
      <DateField source="joined_at" label="Joined" />
    </Datagrid>
  </List>
);

export const ProgramMembershipEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="membership_id" label="Membership ID" disabled />
      <TextInput source="user_id" label="User ID" required />
      <TextInput source="program_id" label="Program ID" required />
      <TextInput source="brand_id" label="Brand ID" required />
      <NumberInput source="tasks_completed" label="Tasks Completed" />
      <NumberInput source="sales_attributed" label="Sales Attributed" />
    </SimpleForm>
  </Edit>
);

export const ProgramMembershipShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="membership_id" label="Membership ID" />
      <TextField source="user_id" label="User ID" />
      <TextField source="program_id" label="Program ID" />
      <TextField source="brand_id" label="Brand ID" />
      <NumberField source="tasks_completed" label="Tasks Completed" />
      <NumberField source="sales_attributed" label="Sales Attributed" options={{ style: 'currency', currency: 'USD' }} />
      <DateField source="joined_at" label="Joined" showTime />
      <DateField source="createdAt" label="Created" showTime />
      <DateField source="updatedAt" label="Updated" showTime />
    </SimpleShowLayout>
  </Show>
);
