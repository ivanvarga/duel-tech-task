import {
  Edit,
  SimpleForm,
  TextInput,
  required,
} from 'react-admin';

export const BrandEdit = () => (
  <Edit>
    <SimpleForm>
      <TextInput source="brand_id" label="Brand ID" disabled />
      <TextInput source="name" label="Brand Name" validate={[required()]} />
    </SimpleForm>
  </Edit>
);
