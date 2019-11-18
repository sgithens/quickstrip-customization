import React from 'react';
import {useCookies} from 'react-cookie';
import {DragDropContext, DragStart} from 'react-beautiful-dnd';
import {ListItemInterface, MYOButtonInterface} from '../../interfaces';
import {chunk, startCase} from 'lodash/fp';
import useWindowSize from '../../hooks/useWindowSize';
import {Grid, Link, Menu, MenuItem} from '@material-ui/core';
import {
  ALL_CHOICES_ID,
  BUTTON_LIST,
  COOKIE_OPTIONS,
  GRID,
  HOLDING_BOX_ID,
  MENU_EVENTS,
  QUICK_STRIP_ID,
  QUICKSTRIP_SPACER_ID,
  THIN_SPACER_ID,
  WIDE_SPACER_ID,
} from '../../constants';
import ConfirmDialog from '../ConfirmDialog/ConfirmDialog';
import {
  filterEventsByState,
  getMenuItems,
  getUpdatedHBChunks,
  moveItem,
  mYODataToListItem,
  reorderItems,
  newThinSpacer,
  newWideSpacer,
} from '../../utils/utils';
import {
  focusFirstQuickStripItem,
  focusFirstHoldingBoxItem,
} from '../../utils/keyboardHandler';
import Quickstrip from '../Quickstrip/Quickstrip';
import HoldingBox from '../HoldingBox/HoldingBox';
import AllChoicesList from '../AllChoicesList/AllChoicesList';
import MakeYourOwn from '../MakeYourOwn/MakeYourOwn';
import Spacers from '../Spacers/Spacers';

export interface DragDropContainerProps {
  allChoicesList: ListItemInterface[];
}

const menuItems: {[key: string]: string[]} = {
  [QUICK_STRIP_ID]: getMenuItems(MENU_EVENTS.QUICK_STRIP),
  [HOLDING_BOX_ID]: getMenuItems(MENU_EVENTS.HOLDING_BOX),
};

const DragDropContainer: React.FC<DragDropContainerProps> = ({
  allChoicesList: acl = [],
}) => {
  const [cookies, setCookie] = useCookies([BUTTON_LIST]);
  // var sgithensTestLoad = ["cloud-folder-open", "high-contrast"];
  // setCookie(BUTTON_LIST, sgithensTestLoad, COOKIE_OPTIONS);
  // TODO
  // We need to add a hook here, such that the initial data can be loaded from other
  // sources or overridden. In addition to a cookie, it may be necessary to make an ajax
  // call here, or a call to a function, or a function returning a promise, etc.  It should
  // something that can be customized without too much trouble. - sgithens


  const [myobList, setMYOBList] = React.useState<MYOButtonInterface[]>(cookies[BUTTON_LIST] ? cookies[BUTTON_LIST].filter((b: any) => typeof b !== 'string') : []);
  const [allChoicesList, setAllChoicesList] = React.useState<ListItemInterface[]>([...acl, ...myobList.map(m => mYODataToListItem(m))]);
  const [holdingBoxList, setHoldingBoxList] = React.useState<ListItemInterface[]>([]);
  const [checked, setChecked] = React.useState<string[]>(cookies[BUTTON_LIST] ? cookies[BUTTON_LIST].map((b: any) => typeof b === 'string' ? b : b.buttonName) : []);
  const [
    quickstripList,
    setQuickstripList
  ] = React.useState<ListItemInterface[]>(checked.map(c =>
    allChoicesList.find(a => a.id === c) || (c.includes(WIDE_SPACER_ID) && ({
      id: c,
      label: 'Wide Spacer',
      description: 'Wide Spacer',
    })) || (c.includes(THIN_SPACER_ID) && ({
      id: c,
      label: 'Narrow Spacer',
      description: 'Narrow Spacer',
    })) || ({
      id: c,
      label: startCase(c),
      description: 'Button Not Available Within Settings',
    })
  ));
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [currentMenuItem, setCurrentMenuItem] = React.useState('');
  const [currentElDetails, setCurrentElDetails] = React.useState<any>({
    droppableId: HOLDING_BOX_ID,
    index: 0,
    item: {id: '', label: ''},
  });
  const windowSize = useWindowSize();
  const [isDropDisabled, setIsDropDisabled] = React.useState(false);
  const currentElIsSpacer = currentElDetails && currentElDetails.item.id.includes(QUICKSTRIP_SPACER_ID);
  const currentElIsMYOB = currentElDetails && myobList.some(d => d.buttonName === currentElDetails.item.id);
  const [myobData, setMYOBData] = React.useState<MYOButtonInterface>();
  const toggleChecked = (id: string, choice?: ListItemInterface) => {
    // add to holding box
    if (checked.indexOf(id) === -1) {
      const currentChoice = choice || allChoicesList.find(choice => choice.id === id) || {
        description: '',
        label: '',
        learnMoreLink: '',
        id,
      };
      setHoldingBoxList(prevHoldingBoxList => [currentChoice, ...prevHoldingBoxList]);
    } else {
      // remove from holding box and quickstrip
      setHoldingBoxList(prevHoldingBoxList => prevHoldingBoxList.filter(l => l.id !== id));
      setQuickstripList(prevQuickstripList => prevQuickstripList.filter(l => l.id !== id));
    }
    setChecked(prevChecked => {
      const currentIndex = prevChecked.indexOf(id);
      const newChecked = [...prevChecked];
      if (currentIndex === -1) {
        newChecked.unshift(id);
      } else {
        newChecked.splice(currentIndex, 1);
      }
      return newChecked;
    });
  };
  const containerWidth = (windowSize.width > 1280 ? 1280 : windowSize.width) * (7 / 12);
  const chunkMultiplier = containerWidth > 600
    ? (containerWidth > 960 ? 20 : 16)
    : 9;
  const itemsPerChunk = (containerWidth - (GRID * chunkMultiplier)) / (GRID * 12);
  let holdingBoxChunks = chunk(itemsPerChunk, holdingBoxList);
  while (holdingBoxChunks.length < 2) {
    holdingBoxChunks = [
      ...holdingBoxChunks,
      [],
    ];
  }
  const currentMenuItems = currentElDetails.droppableId.includes(HOLDING_BOX_ID)
    ? menuItems[HOLDING_BOX_ID]
    : filterEventsByState(
      currentElIsSpacer
      ? [MENU_EVENTS.QUICK_STRIP.MOVE_RIGHT, MENU_EVENTS.QUICK_STRIP.MOVE_LEFT]
      : menuItems[QUICK_STRIP_ID],
      quickstripList.length,
      currentElDetails.index
    );
  const getList = (id: string): ListItemInterface[] => (
    id === QUICK_STRIP_ID
    ? quickstripList
    : holdingBoxChunks[Number(id.split(HOLDING_BOX_ID).pop())]
  );
  const getUpdatedHBList = (
    droppableId: string,
    replacementChunk?: ListItemInterface[],
  ): ListItemInterface[] => getUpdatedHBChunks(
    holdingBoxChunks,
    droppableId,
    replacementChunk
  ).flat();
  const handleDragEnd = (result: any) => {
    const { source, destination } = result;
    // dropped outside the list
    if (!destination) {
      return;
    }
    const newSpacer = source.droppableId === THIN_SPACER_ID
      ? newThinSpacer()
      : source.droppableId === WIDE_SPACER_ID
      ? newWideSpacer()
      : null;
    // add spacer to quickstrip
    if (newSpacer) {
      const quickstripClone = Array.from(quickstripList);
      quickstripClone.splice(destination.index, 0, newSpacer);
      setQuickstripList(quickstripClone);
      return;
    }
    // dropped on all choices (remove)
    if (destination.droppableId === ALL_CHOICES_ID) {
      const sourceList = getList(source.droppableId);
      toggleChecked(sourceList[source.index].id);
      return;
    }
    // dropped within same box therefore reorder
    if (source.droppableId === destination.droppableId) {
      const items = reorderItems(
        getList(source.droppableId),
        source.index,
        destination.index
      );
      if (source.droppableId === QUICK_STRIP_ID) {
        setQuickstripList(items || []);
      } else {
        setHoldingBoxList(getUpdatedHBList(source.droppableId, items));
      }
    } else {
      const result = moveItem(
        getList(source.droppableId),
        getList(destination.droppableId),
        source,
        destination
      );
      let updatedHBChunks;
      if (source.droppableId.includes(HOLDING_BOX_ID)) {
        updatedHBChunks = getUpdatedHBChunks(
          holdingBoxChunks,
          source.droppableId,
          result[source.droppableId]
        );
      }
      if (destination.droppableId.includes(HOLDING_BOX_ID)) {
        updatedHBChunks = getUpdatedHBChunks(
          updatedHBChunks || holdingBoxChunks,
          destination.droppableId,
          result[destination.droppableId]
        );
      }
      if (updatedHBChunks) {
        setHoldingBoxList(updatedHBChunks.flat());
      }
      if (source.droppableId === QUICK_STRIP_ID) {
        setQuickstripList(result[source.droppableId] || []);
      }
      if (destination.droppableId === QUICK_STRIP_ID) {
        setQuickstripList(result[destination.droppableId] || []);
      }
    }
  }
  const handleMenuOpen = (event: any, currentElDetails: any) => {
    event.preventDefault();
    if (
      event.type === 'contextmenu'
      || event.type === 'dblclick'
      || event.key === 'Enter'
    ) {
      setCurrentElDetails(currentElDetails);
      setAnchorEl(event.currentTarget);
    }
  };
  const handleMenuCloseClick = () => {
    setAnchorEl(null);
  };
  const handleMenuItemClick = (label: string) => {
    setCurrentMenuItem(label);
    handleMenuCloseClick();
    const source = currentElDetails;
    switch(label) {
      case MENU_EVENTS.HOLDING_BOX.MOVE_TO_QUICK_STRIP:
        handleDragEnd({ source, destination: {
          droppableId: QUICK_STRIP_ID,
          index: 0,
        }});
        focusFirstQuickStripItem();
        break;
      case MENU_EVENTS.QUICK_STRIP.PUT_BACK_ALL_CHOICES:
      case MENU_EVENTS.HOLDING_BOX.REMOVE_FROM_HOLDING_BOX:
        setConfirmDialogOpen(true);
        break;
      case MENU_EVENTS.QUICK_STRIP.MOVE_TO_HOLDING_BOX:
        handleDragEnd({ source, destination: {
          droppableId: `${HOLDING_BOX_ID}${0}`,
          index: 0,
        }});
        focusFirstHoldingBoxItem();
        break;
      case MENU_EVENTS.QUICK_STRIP.MOVE_RIGHT:
        handleDragEnd({ source, destination: {
          ...source,
          index: source.index + 1,
        }});
        break;
      case MENU_EVENTS.QUICK_STRIP.MOVE_LEFT:
        handleDragEnd({ source, destination: {
          ...source,
          index: source.index - 1,
        }});
        break;
      default:
        break;
    }
  };
  const handleConfirmDialogClose = () => setConfirmDialogOpen(false);
  const handleConfirmDialogSubmit = () => {
    toggleChecked(currentElDetails.item.id);
    handleConfirmDialogClose();
  };
  const focusMenuItem = (el: any) => Boolean(anchorEl) && el && el.focus();
  const onSave = () => {
    var valueToSave = quickstripList.map(item => {
      const myob = myobList.find(m => m.buttonName === item.id);
      return myob ? myob : item.id;
    });
    setCookie(BUTTON_LIST, valueToSave, COOKIE_OPTIONS);
    console.log("Sgithens DragDropContainer onSave", valueToSave);
    // TODO See notes further above, but again we need a customizable way
    // to save the data, and then close this window (or potentially perform
    // a redirect), and then potentially return an error if the save
    // didn't work. Should be easy to override. -sgithens
    window.close();
  };
  const handleMakeYourOwnSubmit = (buttonData?: MYOButtonInterface) => {
    if (!!!buttonData) {
      setMYOBData(undefined);
      return;
    }
    const listItem = mYODataToListItem(buttonData);
    // update myob data
    if (myobData) {
      setAllChoicesList(prevState => prevState.map(
        item => item.id === myobData.buttonName
        ? listItem
        : item
      ));
      setHoldingBoxList(prevState => prevState.map(
        item => item.id === myobData.buttonName
        ? listItem
        : item
      ));
      setQuickstripList(prevState => prevState.map(
        item => item.id === myobData.buttonName
        ? listItem
        : item
      ));
      setMYOBList(prevState => prevState.map(
        item => item.buttonName === myobData.buttonName
        ? buttonData
        : item
      ));
      setChecked(prevChecked => {
        const currentIndex = prevChecked.indexOf(myobData.buttonName);
        const newChecked = [...prevChecked];
        newChecked.splice(currentIndex, 1, listItem.id);
        return newChecked;
      });
      setMYOBData(undefined);
      return;
    }
    setMYOBList(prevState => [...prevState, buttonData]);
    setAllChoicesList(prevState => ([
      listItem,
      ...prevState,
    ]));
    toggleChecked(listItem.id, listItem);
    focusFirstHoldingBoxItem();
  };
  const handleDragStart = (initial: DragStart) => {
    setIsDropDisabled(initial.draggableId.includes(QUICKSTRIP_SPACER_ID));
  };
  const removeCurrentElementFromQuickstrip = () => {
    handleMenuCloseClick();
    setQuickstripList(prevState => prevState.filter(i => i.id !== currentElDetails.item.id));
    focusFirstQuickStripItem();
  };
  const handleMYOBEdit = () => {
    handleMenuCloseClick();
    setMYOBData(myobList.find(d => d.buttonName === currentElDetails.item.id));
  };
  return (
    <div>
      <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <Quickstrip {...{handleMenuOpen, onSave, quickstripList}} />
        <Grid container spacing={2}>
          <Grid item xs={7}>
            <HoldingBox {...{handleMenuOpen, holdingBoxChunks, isDropDisabled}} />
          </Grid>
          <Grid item xs={2}>
            <Spacers />
          </Grid>
          <Grid item xs={3}>
            <MakeYourOwn
              data={myobData}
              names={allChoicesList.map(c => c.label)}
              onSubmit={handleMakeYourOwnSubmit}
            />
          </Grid>
        </Grid>
        <AllChoicesList {...{checked, isDropDisabled, list: allChoicesList, onToggle: toggleChecked}} />
      </DragDropContext>
      <Menu
        id="quickstrip-item-menu"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        keepMounted
        onClose={handleMenuCloseClick}
        anchorOrigin={{vertical: 'top', horizontal: 'right'}}
      >
        {currentMenuItems.map((label, index) => (
          <MenuItem
            {...(index === 0 ? {ref: focusMenuItem} : {})}
            key={label}
            onClick={() => handleMenuItemClick(label)}>
            {label}
          </MenuItem>
        ))}
        {currentElIsSpacer && (
          <MenuItem onClick={removeCurrentElementFromQuickstrip}>
            Remove Spacer
          </MenuItem>
        )}
        {currentElIsMYOB && (
          <MenuItem onClick={handleMYOBEdit}>
            Edit Button
          </MenuItem>
        )}
        {currentElDetails.item.learnMoreLink && (
          <MenuItem
            onClick={() => window.open(currentElDetails.item.learnMoreLink, '_blank')}
          >
            <Link
              href={currentElDetails.item.learnMoreLink}
              variant="body1"
              target="_blank"
              rel="noopener"
              color="textPrimary"
              underline="none"
              onClick={(e: React.MouseEvent) => e.preventDefault()}
              onMouseDown={(e: React.MouseEvent) => e.preventDefault()}
            >
              Learn More
            </Link>
          </MenuItem>
        )}
      </Menu>
      <ConfirmDialog
        description={`Are you sure you want to ${currentMenuItem.toLowerCase()}?`}
        open={confirmDialogOpen}
        onClose={handleConfirmDialogClose}
        onSubmit={handleConfirmDialogSubmit} />
    </div>
  );
}

export default DragDropContainer;
