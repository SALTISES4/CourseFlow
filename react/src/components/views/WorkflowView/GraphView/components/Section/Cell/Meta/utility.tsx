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

type IconMapGroup = Record<string, ReactElement>

const contextIconMap: IconMapGroup = {
  // activity
  individual_work: <Person2OutlinedIcon />,
  work_in_groups: <GroupOutlinedIcon />,
  in_the_classroom: <Groups2OutlinedIcon />,

  // course
  formative: <PsychologyOutlinedIcon />,
  summative: <ChecklistOutlinedIcon />,
  comprehensive: <GradingOutlinedIcon />
}

const taskIconMap: IconMapGroup = {
  // activity
  gather_information: <SearchOutlinedIcon />,
  discuss: <ForumOutlinedIcon />,
  problem_solve: <LightbulbOutlinedIcon />,
  analyze: <ImageSearchOutlinedIcon />,
  assess_review_peers: <FactCheckOutlinedIcon />,
  debate: <SafetyDividerOutlinedIcon />,
  game_roleplay: <CasinoOutlinedIcon />,
  create_design: <DrawOutlinedIcon />,
  revise_improve: <CachedOutlinedIcon />,
  read: <ChromeReaderModeOutlinedIcon />,
  write: <EditOutlinedIcon />,
  present: <InterpreterModeOutlinedIcon />,
  experiment_inquiry: <ScienceOutlinedIcon />,
  quiz_test: <QuizOutlinedIcon />,
  instructor_resource_curation: <CollectionsBookmarkOutlinedIcon />,
  instructor_orchestration: <DeviceHubOutlinedIcon />,
  instructor_evaluation: <AssignmentTurnedInOutlinedIcon />,
  other: <MoreHorizOutlinedIcon />,

  // course
  jigsaw: <ExtensionOutlinedIcon />,
  peer_instruction: <ChecklistOutlinedIcon />,
  case_studies: <ContentPasteSearchOutlinedIcon />,
  gallery_walk: <CollectionsOutlinedIcon />,
  reflective_writing: <EditNoteOutlinedIcon />,
  two_stage_exam: <BallotOutlinedIcon />,
  toolkit: <HomeRepairServiceOutlinedIcon />,
  one_minute_paper: <TimerOutlinedIcon />,
  distributed_problem_solving: <PolylineOutlinedIcon />,
  peer_assessment: <GradingOutlinedIcon />
}

export function getIcon(type: 'context' | 'task', value: string | null) {
  if (!value || value === 'none') {
    return undefined
  }
  return type === 'context' ? contextIconMap[value] : taskIconMap[value]
}
