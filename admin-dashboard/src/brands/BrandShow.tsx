import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  ReferenceManyField,
  Datagrid,
  SelectField,
} from 'react-admin';

const typeChoices = [
  { id: 'influencer', name: 'Influencer' },
  { id: 'ambassador', name: 'Ambassador' },
  { id: 'affiliate', name: 'Affiliate' },
];

export const BrandShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="brand_id" label="Brand ID" />
      <TextField source="name" label="Brand Name" />
      <DateField source="createdAt" label="Created At" showTime />
      <DateField source="updatedAt" label="Updated At" showTime />

      <ReferenceManyField
        label="Programs"
        reference="programs"
        target="brand_id"
      >
        <Datagrid bulkActionButtons={false}>
          <TextField source="program_id" label="Program ID" />
        </Datagrid>
      </ReferenceManyField>
    </SimpleShowLayout>
  </Show>
);
