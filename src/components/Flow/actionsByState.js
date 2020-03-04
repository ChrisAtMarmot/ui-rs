import initialToUpper from '../../util/initialToUpper';
/*
 * This object describes what to render for a request given its state (directories
 * relative to src/components/Flow).
 *
 * SOME_STATE: {
 *   cards: <array of names of components exported from the cardsByRequest directory>
 *   primaryAction: <name of component exported from the primaryActions directory>
 *   moreActions: <array of names of components exported from the moreActions directory>
 *   secondHeadline: <array of names of components exported from the secondHeadlines directory>
 * }
 *
 * moreActions will appear after any validActions provided on the request record. Custom
 * components will be used for validActions if available (eg. named after the action).
 * If no primaryAction is specified the first entry in validActions will be used, specify
 * a null primaryAction for states to suppress this.
 *
 * validActions without a component named for them will be rendered with the component
 * "Generic" which is roughly the ActionButton for moreActions and the ScanConfirmAction
 * for a primaryAction with accomodations for missing translations.
 *
 * Translations for generic components:
 *
 * ui-rs.actions.<action name> - name of action
 * ui-rs.actions.<action name>.success - message banner when action succeeds
 * ui-rs.actions.<action name>.error - message banner when action fails
 * ui-rs.actions.<action name>.prompt - prompt for scanning request barcode to exec
 *
 * Where the above are missing, ui-rs.actions.<action name> will be substituted into
 * ui-rs.actions.generic.* to provide generic success/error/prompt messages.
 *
*/

export const actionsByState = {
  default: {
    cards: ['Bibliographic', 'RequesterSupplier'],
    primaryAction: null,
    moreActions: [],
  },
  RES_IDLE:{
    primaryAction: '',
    moreActions: ['RespondYes', 'SupplierCannotSupply'],
  },
  RES_NEW_AWAIT_PULL_SLIP: {
    primaryAction: 'PrintPullSlip',
    moreActions: ['SupplierCannotSupply'],
  },
  RES_AWAIT_PICKING: {
    primaryAction: 'SupplierCheckInToReshare',
    moreActions: ['PrintPullSlip', 'SupplierCannotSupply'],
  },
  RES_CHECKED_IN_TO_RESHARE: {
    primaryAction: 'SupplierMarkShipped',
    moreActions: ['SupplierMarkShipped', 'PrintPullSlip', 'SupplierCannotSupply'],
  },
  RES_ITEM_RETURNED: {
    primaryAction: 'SupplierCheckOutOfReshare',
    moreActions: ['SupplierCheckOutOfReshare'],
  },
  RES_AWAIT_SHIP: {
    primaryAction: 'SupplierMarkShipped',
    moreActions: ['SupplierMarkShipped'],
  },
  REQ_SHIPPED: {
    primaryAction: 'RequesterReceived',
    moreActions: ['RequesterReceived', 'PrintPullSlip'],
  },
  REQ_BORROWING_LIBRARY_RECEIVED: {
    primaryAction: 'RequesterManualCheckIn',
  },
  REQ_CHECKED_IN: {
    primaryAction: 'PatronReturnedItem',
    moreActions: ['PatronReturnedItem', 'ShippedReturn', 'PrintPullSlip'],
  },
  REQ_AWAITING_RETURN_SHIPPING: {
    primaryAction: 'ShippedReturn',
    moreActions: ['ShippedReturn', 'PrintPullSlip'],
  }
};

/* The idea behind this object is that we can use it to lookup whether or not any given action needs the ability to add a note or not,
   freeing us from having to change multiple places when any changes/additions are made.
*/
export const includesNote = {
  default: true,
  supplierPrintPullSlip: false,
  supplierManualCheckout: false,
  supplierMarkShipped: true,
  requesterReceived: true,
  patronReturnedItem: false,
  shippedReturn: true,
  supplierCheckOutOfReshare: true,
  // Special cases, where this file isn't drawn from at the moment:
  // modals
  RespondYes: true,
  SupplierCannotSupply: true,
  // others, triggered by other means
  SupplierCheckInToReshare: false,
  PrintPullSlip: false,
};

/* Actions from request.validActions to exclude from all states when using the below function */
const excludeRemote = ['message'];

/* This function returns the contextual actions for a provided request,
 * falling back to the default for unknown states.
 */
export const actionsForRequest = request => {
  const actions = Object.assign({}, actionsByState.default, actionsByState[request.state.code] || {});
  if (Array.isArray(request.validActions)) {
    const remote = request.validActions.filter(
      action => actions.primaryAction !== initialToUpper(action) && !(excludeRemote.includes(action))
    );
    const client = actions.moreActions.filter(
      action => !(remote.includes(`${action.charAt(0).toLowerCase()}${action.substring(1)}`))
    );
    actions.moreActions = remote.concat(client);
    if (remote.length > 0 && actionsByState?.[request.state.code]?.primaryAction === undefined) actions.primaryAction = remote[0];
  }
  return actions;
};
