import { _t } from '@cf/utility/Utility.class'
import { StyledMenu } from '@cfComponents/globalNav/TopBar/styles'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import IconButton, { IconButtonProps } from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import Stack from '@mui/material/Stack'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import { MouseEvent, ReactElement, ReactNode, useState } from 'react'

const StyledPopover = styled(Popover)({
  '& .MuiPaper-root': {
    marginLeft: '3em',
    width: 500
  }
})

/*******************************************************
 * This file contains menu 'builders' the accept a config list, as a plain object
 *  and construct some different menu types based around MUI menu
 *******************************************************/

type BaseMenuItemType = {
  action?: any
  show?: boolean
  id?: string
  title?: string
  icon?: ReactElement
  seperator?: boolean
  showIconInList?: boolean
}

type IconButtonMenuItemType = BaseMenuItemType & {
  iconButton: IconButtonProps & {
    icon: ReactElement
  }
  content?: never
}

type ContentMenuItemType = BaseMenuItemType & {
  iconButton?: never
  content: string | ReactElement
}

export type MenuItemType = IconButtonMenuItemType | ContentMenuItemType

const MenuToggleButton = (props: MenuItemType) => {
  if (!props.show) {
    return null
  }

  const buttonProps = {
    ...props,
    content: null,
    action: null,
    onClick: props.action
  }

  if ('iconButton' in props) {
    return (
      <IconButton
        size={buttonProps.iconButton.size ?? 'small'}
        color={buttonProps.iconButton.color}
        {...buttonProps}
      >
        {props.iconButton.icon}
      </IconButton>
    )
  }

  if (typeof props.content === 'string') {
    return (
      <Button
        size="small"
        startIcon={props.showIconInList && props.icon}
        {...buttonProps}
      >
        {props.content}
      </Button>
    )
  }

  return props.content
}

export const ListMenuItem = ({
  id,
  title,
  content,
  action,
  show,
  seperator,
  showIconInList,
  icon
}: MenuItemType) => {
  if (!show) {
    return null
  }

  const contentChooser = (content: string | ReactElement) => {
    if (typeof content === 'string') {
      return (
        <>
          {showIconInList && icon} <Typography>{content}</Typography>
        </>
      )
    }
    return content
  }

  return (
    <>
      <MenuItem id={`${id}-button`} onClick={action} title={title}>
        {contentChooser(content)}
      </MenuItem>
      {seperator && <Divider />}
    </>
  )
}

// Regular menu structure
const SimpleMenu = ({
  id,
  menuItems,
  header
}: {
  id: string
  menuItems: MenuItemType[]
  header: MenuItemType
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const onClickHandler = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const buttons = menuItems.map((item, el) => {
    return <ListMenuItem key={item.id} {...item} />
  })

  return (
    <>
      <MenuToggleButton
        id={`${id}-button`}
        data-test-id={`${id}-button`}
        aria-controls={`${id}-menu`}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : 'false'}
        action={onClickHandler}
        {...header}
      />
      <StyledMenu
        id={`${id}-menu`}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        {buttons}
      </StyledMenu>
    </>
  )
}

// A list of menu items, with a size limiter (moving overflow into [...] button)
const MenuWithOverflow = ({
  size,
  menuItems,
  buttonColor,
  buttonSize = 'medium'
}: {
  size: number
  menuItems: MenuItemType[]
  buttonColor: IconButtonProps['color']
  buttonSize?: IconButtonProps['size']
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const onClickHandler = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const menuEls = menuItems.map((item, index) => {
    if (size && index < size) {
      const props = item

      if ('iconButton' in props) {
        props.iconButton = {
          ...props.iconButton,
          color: buttonColor,
          size: buttonSize
        }
      }

      return (
        <MenuToggleButton
          key={props.id}
          id={`${props.id}-button`}
          data-test-id={`${props.id}-button`}
          aria-controls={`${props.id}-menu`}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : 'false'}
          action={onClickHandler}
          {...props}
        />
      )
    } else {
      return <ListMenuItem key={item.id} {...item} />
    }
  })

  const visibleButtons = menuEls.slice(0, size)
  const overflowButtons = menuEls.slice(size)

  return (
    <>
      <Stack direction="row" spacing={1}>
        {visibleButtons}
        {overflowButtons.length && (
          <MenuToggleButton
            show={true}
            id="overflow-button"
            data-test-id="overflow-button"
            aria-controls="overflow-menu"
            aria-haspopup="true"
            aria-expanded={open ? 'true' : 'false'}
            action={onClickHandler}
            iconButton={{
              icon: <MoreHorizIcon />,
              size: buttonSize,
              color: buttonColor
            }}
          />
        )}
      </Stack>
      {overflowButtons.length && (
        <Menu
          id="basic-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            'aria-labelledby': 'basic-button'
          }}
        >
          {overflowButtons}
        </Menu>
      )}
    </>
  )
}

type StaticMenuProps = {
  id: string
  menuItems?: MenuItemType[] // Optional if you might only have content
  header: MenuItemType
  content?: ReactNode // Optional content to be displayed
}

// Non-standard/custom menu with content you inject through props
const StaticMenu = ({
  id,
  menuItems = [], // Default to an empty array if not provided
  header,
  content
}: StaticMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const onClickHandler = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)

  return (
    <>
      <MenuToggleButton
        id={`${id}-button`}
        data-test-id={`${id}-button`}
        aria-controls={`${id}-menu`}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : 'false'}
        action={onClickHandler}
        {...header}
      />

      <StyledPopover
        anchorEl={anchorEl}
        id={`${id}-menu`}
        keepMounted
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        open={open}
        onClose={handleClose}
      >
        {content}
      </StyledPopover>
    </>
  )
}

const HoverMenu = ({
  id,
  menuItems
}: {
  id?: string
  menuItems: MenuItemType[]
}) => {
  const [show, setShow] = useState<boolean>(false)

  const buttons = menuItems.map((item, el) => {
    return (
      <ActionButton
        key={item.id}
        buttonIcon={item.icon}
        buttonClass="insert-sibling-button"
        titleText={item.title}
        onClickHandler={item.action}
      />
    )
  })

  return (
    <div id={id} style={{ position: 'absolute', top: 0, right: 0 }}>
      {buttons}
      {/*{canWrite && (*/}
      {/*  <>*/}
      {/*    <InsertSiblingButton*/}
      {/*      id={objectId}*/}
      {/*      objectType={objectType}*/}
      {/*      parentId={parentId}*/}
      {/*    />*/}
      {/*    <DuplicateSelfButton*/}
      {/*      id={objectId}*/}
      {/*      objectType={objectType}*/}
      {/*      parentId={parentId}*/}
      {/*    />*/}
      {/*    <DeleteSelfButton id={objectId} objectType={objectType} />*/}
      {/*  </>*/}
      {/*)}*/}
      {/*{canComment && <AddCommentingButton show={show} setShow={setShow} />}*/}
    </div>

    // {/*{show && (*/}
    // {/*  <CommentBox id={objectId} setShow={setShow} objectType={objectType} />*/}
    // {/*)}*/}
    // {/*{show && memoizedCommentBox}*/}
  )
}

export { MenuWithOverflow, SimpleMenu, StaticMenu, HoverMenu }
