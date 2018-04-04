import Settings from '../../settings';
import ethereumNodeRemote from '../../ethereumNodeRemote';
import { InfuraEndpoints } from '../../constants';

export function syncNodeDefaults() {
  return dispatch => {
    const network =
      Settings.network || Settings.loadUserData('network') || 'main';
    const syncMode =
      Settings.syncmode || Settings.loadUserData('syncmode') || 'fast';
    dispatch({ type: '[MAIN]:NODES:CHANGE_NETWORK', payload: { network } });
    dispatch({ type: '[MAIN]:NODES:CHANGE_SYNC_MODE', payload: { syncMode } });
  };
}

export function changeNetwork(network) {
  ethereumNodeRemote.setNetwork(network);
  return { type: '[MAIN]:NODES:CHANGE_NETWORK', payload: { network } };
}

export function changeSyncMode(syncMode) {
  return { type: '[MAIN]:NODES:CHANGE_SYNC_MODE', payload: { syncMode } };
}

export function syncLocalNode(sync) {
  return (dispatch, getState) => {
    const thisCurrentBlock = parseInt(sync.currentBlock, 16);
    const thisKnownStates = parseInt(sync.knownStates, 16);
    const localCurrentBlock = getState().nodes.local.currentBlock;
    const localKnownStates = getState().nodes.local.knownStates;

    if (
      thisCurrentBlock > localCurrentBlock ||
      thisKnownStates > localKnownStates
    ) {
      dispatch({
        type: '[MAIN]:LOCAL_NODE:SYNC_UPDATE',
        payload: {
          currentBlock: parseInt(sync.currentBlock, 16),
          highestBlock: parseInt(sync.highestBlock, 16),
          knownStates: parseInt(sync.knownStates, 16),
          pulledStates: parseInt(sync.pulledStates, 16),
          startingBlock: parseInt(sync.startingBlock, 16)
        }
      });
    }
  };
}

export function remoteBlockReceived(blockHeader) {
  const { number, timestamp } = blockHeader;
  return {
    type: '[MAIN]:REMOTE_NODE:BLOCK_HEADER_RECEIVED',
    payload: {
      blockNumber: number,
      timestamp: timestamp
    }
  };
}

export function resetLocalNode() {
  return { type: '[MAIN]:LOCAL_NODE:RESET' };
}

export function resetRemoteNode() {
  return { type: '[MAIN]:REMOTE_NODE:RESET' };
}

export function setActiveNode(state) {
  return dispatch => {
    // If local node is 15 or more blocks behind remote, ensure remote is active.
    // Otherwise, local should be active.
    const { active, network, local, remote } = state.nodes;

    const supportedRemoteNetworks = Object.keys(
      InfuraEndpoints.ethereum.websockets
    )
      .map(network => network.toLowerCase())
      .push('nosync');

    if (!supportedRemoteNetworks.includes(network)) {
      if (active === 'remote') {
        dispatch({
          type: '[MAIN]:NODES:CHANGE_ACTIVE',
          payload: { active: 'local' }
        });
      }
      return;
    }

    if (active === 'remote') {
      if (remote.blockNumber - local.currentBlock < 15) {
        dispatch({
          type: '[MAIN]:NODES:CHANGE_ACTIVE',
          payload: { active: 'local' }
        });
      }
    } else {
      if (remote.blockNumber - local.currentBlock >= 15) {
        dispatch({
          type: '[MAIN]:NODES:CHANGE_ACTIVE',
          payload: { active: 'remote' }
        });
      }
    }
  };
}
