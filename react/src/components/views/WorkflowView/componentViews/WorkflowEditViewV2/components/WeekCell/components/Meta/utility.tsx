import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import BallotOutlinedIcon from '@mui/icons-material/BallotOutlined'
import CachedOutlinedIcon from '@mui/icons-material/CachedOutlined'
import CasinoOutlinedIcon from '@mui/icons-material/CasinoOutlined'
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined'
import ChromeReaderModeOutlinedIcon from '@mui/icons-material/ChromeReaderModeOutlined'
import CollectionsBookmarkOutlinedIcon from '@mui/icons-material/CollectionsBookmarkOutlined'
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import ContentPasteSearchOutlinedIcon from '@mui/icons-material/ContentPasteSearchOutlined'
import DeviceHubOutlinedIcon from '@mui/icons-material/DeviceHubOutlined'
import DrawOutlinedIcon from '@mui/icons-material/DrawOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined'
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined'
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined'
import GradingOutlinedIcon from '@mui/icons-material/GradingOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import HomeRepairServiceOutlinedIcon from '@mui/icons-material/HomeRepairServiceOutlined'
import ImageSearchOutlinedIcon from '@mui/icons-material/ImageSearchOutlined'
import InterpreterModeOutlinedIcon from '@mui/icons-material/InterpreterModeOutlined'
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined'
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined'
import Person2OutlinedIcon from '@mui/icons-material/Person2Outlined'
import PolylineOutlinedIcon from '@mui/icons-material/PolylineOutlined'
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined'
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined'
import SafetyDividerOutlinedIcon from '@mui/icons-material/SafetyDividerOutlined'
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import { ReactElement } from 'react'

type IconMapGroup = {
  [index: number]: ReactElement
}

const contextIconMap: IconMapGroup = {
  // activity
  1: <Person2OutlinedIcon />,
  2: <GroupOutlinedIcon />,
  3: <Groups2OutlinedIcon />,

  // course
  101: <PsychologyOutlinedIcon />,
  102: <ChecklistOutlinedIcon />,
  103: <GradingOutlinedIcon />
}

const taskIconMap: IconMapGroup = {
  // activity
  1: <SearchOutlinedIcon />,
  2: <ForumOutlinedIcon />,
  3: <LightbulbOutlinedIcon />,
  4: <ImageSearchOutlinedIcon />,
  5: <FactCheckOutlinedIcon />,
  6: <SafetyDividerOutlinedIcon />,
  7: <CasinoOutlinedIcon />,
  8: <DrawOutlinedIcon />,
  9: <CachedOutlinedIcon />,
  10: <ChromeReaderModeOutlinedIcon />,
  11: <EditOutlinedIcon />,
  12: <InterpreterModeOutlinedIcon />,
  13: <ScienceOutlinedIcon />,
  14: <QuizOutlinedIcon />,
  15: <CollectionsBookmarkOutlinedIcon />,
  16: <DeviceHubOutlinedIcon />,
  17: <AssignmentTurnedInOutlinedIcon />,
  18: <MoreHorizOutlinedIcon />,

  // course
  101: <ExtensionOutlinedIcon />,
  102: <ChecklistOutlinedIcon />,
  103: <ContentPasteSearchOutlinedIcon />,
  104: <CollectionsOutlinedIcon />,
  105: <EditNoteOutlinedIcon />,
  106: <BallotOutlinedIcon />,
  107: <HomeRepairServiceOutlinedIcon />,
  108: <TimerOutlinedIcon />,
  109: <PolylineOutlinedIcon />,
  110: <GradingOutlinedIcon />
}

export function getIcon(type: 'context' | 'task', value: number) {
  return type === 'context' ? contextIconMap[value] : taskIconMap[value]
}
