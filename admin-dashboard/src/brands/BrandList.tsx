import {
  List,
  Datagrid,
  TextField,
  TextInput,
} from 'react-admin';

const brandFilters = [
  <TextInput key="q" label="Search" source="q" alwaysOn />,
];

export const BrandList = () => (
  <List filters={brandFilters} perPage={25} sort={{ field: 'name', order: 'ASC' }} exporter={false}>
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="brand_id" label="Brand ID" />
      <TextField source="name" label="Brand Name" />
    </Datagrid>
  </List>
);
