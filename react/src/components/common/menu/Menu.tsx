import { _t } from '@cf/utility/Utility.class'
import { StyledMenu } from '@cfComponents/globalNav/TopBar/styles'
import ActionButton from '@cfComponents/UIPrimitives/ActionButton'
import MoreHorizIcon from '@mui/icons-material/MoreHoriz'
import { Menu } from '@mui/material'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import MenuItem from '@mui/material/MenuItem'
import Popover from '@mui/material/Popover'
import { styled } from '@mui/material/styles'
import Switch from '@mui/material/Switch'
import Typography from '@mui/material/Typography'
import { ChangeEvent, ReactElement, ReactNode, useMemo, useState } from 'react'
import * as React from 'react'

const StyledPopover = styled(Popover)({
  '& .MuiPaper-root': {
    marginLeft: '3em',
    width: 500
  }
})

export const MenuItemLabel = styled(MenuItem)({
  textTransform: 'uppercase',
  fontSize: '12px'
})
/*******************************************************
 * MENU ITEMS
 *******************************************************/

/*******************************************************
 * This file contains menu 'builders' the accept a config list, as a plain object
 *  and construct some different menu types based around MUI menu
 *******************************************************/

export type MenuItemType = {
  content: string | ReactElement
  action?: any
  show?: boolean
  id?: string
  title?: string
  sectionTitle?: string
  icon?: ReactElement
  seperator?: boolean
  showIconInList?: boolean
  defaultChecked?: boolean
}

export const IconMenuItem = ({
  id,
  title,
  action,
  icon,
  show
}: MenuItemType) => {
  if (!show) {
    return null
  }

  return (
    <div
      className="hover-shade"
      id={`${id}-project-button`}
      title={title}
      onClick={action}
    >
      {icon}
    </div>
  )
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
      <MenuItem
        id={`${id}-button`}
        className="hover-shade"
        onClick={action}
        title={title}
      >
        {contentChooser(content)}
      </MenuItem>
      {seperator && <Divider />}
    </>
  )
}

type PropsType = {
  disabled?: boolean
  children: ReactNode
  name: string
  onChange: (key: string, checked: boolean) => void
  seperator?: boolean
  defaultChecked?: boolean
}

const SwitchMenuItem = ({
  children,
  name,
  disabled,
  onChange,
  seperator,
  defaultChecked
}: PropsType) => (
  <>
    <MenuItem disableRipple>
      <FormControlLabel
        control={
          <Switch
            size="medium"
            checked={defaultChecked}
            disabled={disabled}
            onChange={(_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
              onChange(name, checked)
            }}
          />
        }
        label={children}
      />
    </MenuItem>
    {seperator && <Divider />}
  </>
)

const SimpleSwitchMenu = ({
  id,
  menuItems,
  header
}: {
  id: string
  menuItems: MenuItemType[]
  header: MenuItemType
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const onClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const buttons = menuItems.map((item, idx) => {
    const Title = () => {
      if (item.sectionTitle) {
        return (
          <MenuItemLabel key={idx} disabled>
            {item.sectionTitle}
          </MenuItemLabel>
        )
      }
      return <></>
    }

    return [
      <Title />,
      item.content && (
        <SwitchMenuItem
          key={JSON.stringify(item.content)}
          name={JSON.stringify(item.content)}
          disabled={!item.show}
          defaultChecked={item.defaultChecked}
          onChange={item.action}
          seperator={item.seperator}
        >
          {item.content}
        </SwitchMenuItem>
      )
    ]
  })

  return (
    <>
      <Button
        id={`${id}-button`}
        data-test-id={`${id}-button`}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={onClickHandler}
      >
        <ListMenuItem {...header} />
      </Button>
      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
      >
        {buttons}
      </StyledMenu>
    </>
  )
}
/*******************************************************
 * MENUS
 *******************************************************/
const SimpleMenu = ({
  id,
  menuItems,
  header
}: {
  id: string
  menuItems: MenuItemType[]
  header: MenuItemType
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const onClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
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
      <Button
        id={`${id}-button`}
        data-test-id={`${id}-button`}
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={onClickHandler}
      >
        <ListMenuItem {...header} />
      </Button>
      <StyledMenu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button'
        }}
      >
        {buttons}
      </StyledMenu>
    </>
  )
}

const MenuWithOverflow = ({
  size,
  menuItems
}: {
  size: number
  menuItems: MenuItemType[]
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const onClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  const menuEls = menuItems.map((item, el) => {
    return <ListMenuItem key={item.id} {...item} />
  })

  const visibleButtons = menuEls.slice(0, size)
  const overflowButtons = menuEls.slice(size)

  return (
    <>
      {visibleButtons}
      {overflowButtons.length && (
        <>
          <Button
            id="basic-button"
            aria-controls={open ? 'basic-menu' : undefined}
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            onClick={onClickHandler}
          >
            <MoreHorizIcon />
          </Button>
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
        </>
      )}
    </>
  )
}

type StaticMenuProps = {
  id: string
  menuItems?: MenuItemType[] // Optional if you might only have content
  header: MenuItemType
  content?: React.ReactNode // Optional content to be displayed
}

const StaticMenu = ({
  id,
  menuItems = [], // Default to an empty array if not provided
  header,
  content
}: StaticMenuProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const onClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Button
        id={`${id}-button`}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={onClickHandler}
      >
        {header.content}
      </Button>
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

export { MenuWithOverflow, SimpleMenu, StaticMenu, HoverMenu, SimpleSwitchMenu }
