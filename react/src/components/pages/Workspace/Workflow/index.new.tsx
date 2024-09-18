const WorkflowPage = ({ dispatch }) => {
  const { id } = useParams();
  const [wsConnected, setWsConnected] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [ready, setReady] = useState(false);

  const workflowDetailRespRef = useRef(null);
  const wsServiceRef = useRef(null);
  const wsUserConnectedServiceRef = useRef(null);
  const messageQueueRef = useRef([]);
  const isMessagesQueuedRef = useRef(true);
  const locksRef = useRef({});
  const workflowId = id;

  const [project, setProject] = useState(null);
  const [userName, setIsStrategy] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [projectPermission, setProjectPermission] = useState(null);
  const [workflowPermission, setWorkflowPermission] = useState({});
  const [selectionManager, setSelectionManager] = useState(null);
  const [publicView, setPublicView] = useState(false);

  // Define the functions used by pareAndRouteMessage
  const onWorkflowUpdateReceived = useCallback((data) => {
    dispatch(data.action);
  }, [dispatch]);

  const onLockUpdateReceived = useCallback((data) => {
    const { objectType, objectId, lock, userId, userColour, expires } = data;

    if (!locksRef.current[objectType]) {
      locksRef.current[objectType] = {};
    }

    if (locksRef.current[objectType][objectId]) {
      clearTimeout(locksRef.current[objectType][objectId]);
    }

    dispatch(
      ActionCreator.createLockAction(objectId, objectType, lock, userId, userColour)
    );

    if (lock) {
      locksRef.current[objectType][objectId] = setTimeout(() => {
        dispatch(ActionCreator.createLockAction(objectId, objectType, false));
      }, expires - Date.now());
    } else {
      locksRef.current[objectType][objectId] = null;
    }
  }, [dispatch]);

  const onUserConnectionUpdateReceived = useCallback((data) => {
    wsUserConnectedServiceRef.current.connectionUpdateReceived(data);
  }, []);

  const onParentWorkflowUpdateReceived = useCallback(() => {
    isMessagesQueuedRef.current = true;
    getWorkflowParentDataQueryLegacy(workflowId, (response) => {
      dispatch(ActionCreator.replaceStoreData({ parentNode: [], parentWorkflow: [] }));
      dispatch(ActionCreator.refreshStoreData(response.dataPackage));
      clearQueue(0);
    });
  }, [dispatch, workflowId]);

  const onChildWorkflowUpdateReceived = useCallback((childWorkflowId) => {
    isMessagesQueuedRef.current = true;
    const state = store.getState();
    const node = state.node.find((node) => node.linkedWorkflow === childWorkflowId);

    if (!node) return;

    getWorkflowChildDataQuery(node.id, (response) => {
      dispatch(ActionCreator.refreshStoreData(response.dataPackage));
      clearQueue();
    });
  }, [dispatch]);

  // The main function that routes messages to the correct handlers
  const pareAndRouteMessage = useCallback((e) => {
    const data = JSON.parse(e.data);

    switch (data.type) {
      case DATA_TYPE.WORKFLOW_ACTION:
        onWorkflowUpdateReceived(data.action);
        break;
      case DATA_TYPE.LOCK_UPDATE:
        onLockUpdateReceived(data.action);
        break;
      case DATA_TYPE.CONNECTION_UPDATE:
        onUserConnectionUpdateReceived(data.action);
        break;
      case DATA_TYPE.WORKFLOW_PARENT_UPDATED:
        onParentWorkflowUpdateReceived();
        break;
      case DATA_TYPE.WORKFLOW_CHILD_UPDATED:
        onChildWorkflowUpdateReceived(data.childWorkflowId);
        break;
      default:
        console.log('socket message not handled');
        break;
    }
  }, [onWorkflowUpdateReceived, onLockUpdateReceived, onUserConnectionUpdateReceived, onParentWorkflowUpdateReceived, onChildWorkflowUpdateReceived]);

  // WebSocket services initialization
  useEffect(() => {
    const url = `ws/update/${workflowId}/`;
    wsServiceRef.current = new WebSocketService(url);
    wsUserConnectedServiceRef.current = new WebSocketServiceConnectedUserManager(null, handleConnectedUsersUpdate);
    wsServiceRef.current.connect(onMessageReceived, onConnectionOpened, handleSocketClose);

    getWorkflowById(workflowId).then((response) => {
      workflowDetailRespRef.current = response.dataPackage;
      setupData(response.dataPackage);
      wsUserConnectedServiceRef.current.startUserUpdates({
        userId: response.dataPackage.userId,
        userName: response.dataPackage.userName,
      });
    });

    return () => {
      wsServiceRef.current.disconnect();
    };
  }, [workflowId, onConnectionOpened, handleSocketClose, onMessageReceived, handleConnectedUsersUpdate, setupData]);

  if (!ready) {
    return <Loader />;
  }

  return (
    <WorkFlowConfigProvider
      initialValue={{
        workflowDetailResp: workflowDetailRespRef.current,
        selectionManager,
        editableMethods: {
          lockUpdate: () => { /*...*/ },
          microUpdate: () => { /*...*/ },
          changeField: () => { /*...*/ }
        },
        ws: {
          wsConnected,
          connectedUsers
        },
        permissions: {
          projectPermission,
          workflowPermission
        }
      }}
    >
      <WorkflowTabs />
    </WorkFlowConfigProvider>
  );
};

export default connect()(WorkflowPage);
