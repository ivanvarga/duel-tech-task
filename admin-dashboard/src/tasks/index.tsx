import { List, Datagrid, TextField, DateField, SelectField, NumberField, UrlField, Edit, SimpleForm, TextInput, SelectInput, NumberInput, Show, SimpleShowLayout, FunctionField } from 'react-admin';

const platformChoices = [
  { id: 'Instagram', name: 'Instagram' },
  { id: 'TikTok', name: 'TikTok' },
  { id: 'Facebook', name: 'Facebook' },
];

const taskFilters = [
  <TextInput key="user_id" label="User ID" source="user_id" />,
  <TextInput key="program_id" label="Program ID" source="program_id" />,
  <SelectInput key="platform" label="Platform" source="platform" choices={platformChoices} />,
];

export const TaskList = () => (
  <List filters={taskFilters} exporter={false}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="task_id" label="Task ID" />
      <TextField source="user_id" label="User ID" />
      <TextField source="program_id" label="Program ID" />
      <SelectField source="platform" choices={platformChoices} />
      <NumberField source="likes" />
      <NumberField source="reach" />
      <FunctionField
        label="Engagement %"
        render={(record: any) => {
          const engagement = (record.likes || 0) + (record.comments || 0) + (record.shares || 0);
          const rate = record.reach > 0 ? engagement / record.reach : 0;
          return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(rate);
        }}
      />
      <DateField source="submitted_at" label="Submitted" />
    </Datagrid>
  </List>
);

export const TaskEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="task_id" label="Task ID" disabled />
      <TextInput source="user_id" label="User ID" required />
      <TextInput source="program_id" label="Program ID" required />
      <TextInput source="membership_id" label="Membership ID" required />
      <SelectInput source="platform" choices={platformChoices} required />
      <TextInput source="post_url" label="Post URL" type="url" />
      <NumberInput source="likes" />
      <NumberInput source="comments" />
      <NumberInput source="shares" />
      <NumberInput source="reach" />
    </SimpleForm>
  </Edit>
);

export const TaskShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="task_id" label="Task ID" />
      <TextField source="user_id" label="User ID" />
      <TextField source="program_id" label="Program ID" />
      <TextField source="membership_id" label="Membership ID" />
      <TextField source="brand_id" label="Brand ID" />
      <SelectField source="platform" choices={platformChoices} />
      <UrlField source="post_url" label="Post URL" />
      <NumberField source="likes" />
      <NumberField source="comments" />
      <NumberField source="shares" />
      <NumberField source="reach" />
      <FunctionField
        label="Engagement Rate"
        render={(record: any) => {
          const engagement = (record.likes || 0) + (record.comments || 0) + (record.shares || 0);
          const rate = record.reach > 0 ? engagement / record.reach : 0;
          return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(rate);
        }}
      />
      <DateField source="submitted_at" label="Submitted" showTime />
      <DateField source="createdAt" label="Created" showTime />
      <DateField source="updatedAt" label="Updated" showTime />
    </SimpleShowLayout>
  </Show>
);
