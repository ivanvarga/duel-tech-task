import { Admin, Resource, CustomRoutes, Layout, Menu, AppBar } from 'react-admin';
import { Route } from 'react-router-dom';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CampaignIcon from '@mui/icons-material/Campaign';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WorkIcon from '@mui/icons-material/Work';
import { Box, Typography } from '@mui/material';
import { dataProvider } from './dataProvider';
import { UserList, UserEdit, UserShow } from './users';
import { FailedImportList, FailedImportEdit, FailedImportShow } from './failedImports';
import { BrandList, BrandEdit, BrandShow } from './brands';
import { ProgramList } from './programs/index.tsx';
import { ProgramMembershipList, ProgramMembershipEdit, ProgramMembershipShow } from './programMemberships/index.tsx';
import { TaskList, TaskEdit, TaskShow } from './tasks/index.tsx';
import { WorkerDashboard } from './workers';
import { MenuItem } from '@mui/material';
import DuelLogo from './assets/duel_logo.svg';
import { duelTheme } from './theme';

const CustomMenu = () => (
  <Menu>
    <Menu.ResourceItem name="brands" />
    <Menu.ResourceItem name="program-memberships" />
    <Menu.ResourceItem name="users" />
    <Menu.ResourceItem name="tasks" />
    <Menu.ResourceItem name="failed-imports" />
    <Menu.Item to="/workers" primaryText="Workers" leftIcon={<WorkIcon />} />
  </Menu>
);

const CustomAppBar = () => (
  <AppBar>
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <img
        src={DuelLogo}
        alt="Duel"
        style={{ height: '32px', width: 'auto' }}
      />
    </Box>
  </AppBar>
);

const CustomLayout = (props: any) => (
  <Layout {...props} menu={CustomMenu} appBar={CustomAppBar} />
);

const App = () => (
  <Admin dataProvider={dataProvider} title="Advocacy Platform Admin" layout={CustomLayout} theme={duelTheme}>
    <Resource
      name="brands"
      list={BrandList}
      edit={BrandEdit}
      show={BrandShow}
      icon={LocalOfferIcon}
    />
    <Resource
      name="programs"
    />
    <Resource
      name="program-memberships"
      list={ProgramMembershipList}
      edit={ProgramMembershipEdit}
      show={ProgramMembershipShow}
      icon={CardMembershipIcon}
      options={{ label: 'Memberships' }}
    />
    <Resource
      name="users"
      list={UserList}
      edit={UserEdit}
      show={UserShow}
      icon={PeopleIcon}
    />
    <Resource
      name="tasks"
      list={TaskList}
      edit={TaskEdit}
      show={TaskShow}
      icon={AssignmentIcon}
    />
    <Resource
      name="failed-imports"
      list={FailedImportList}
      edit={FailedImportEdit}
      show={FailedImportShow}
      icon={ErrorOutlineIcon}
      options={{ label: 'Failed Imports' }}
    />
    <CustomRoutes>
      <Route path="/workers" element={<WorkerDashboard />} />
    </CustomRoutes>
  </Admin>
);

export default App;
