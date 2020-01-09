// IMPORTANT NOTE
//
// When running a dev system on localhost under HTTP (not HTTPS), in
// at least some configurations, Firefox 16.0.1 will fail to print,
// reporting "SecurityError: The operation is insecure" when clicking
// the Print button. Possible fixes:
//
// * In `about:config`, remove `localhost` from the the
//   comma-separated list of domains in the
//   `network.trr.excluded-domains` property. This sometimes seems to
//   work, and other times does not.
// * Use Chrome instead of Firefox.
// * Run your development system under HTTPS somehow.

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { withRouter } from 'react-router';
import ReactToPrint from 'react-to-print';
import { Button, PaneHeaderIconButton, HotKeys } from '@folio/stripes/components';
import PullSlip from './PullSlip';
import css from './PrintPullSlip.css';

class PrintPullSlip extends React.Component {
  static propTypes = {
    record: PropTypes.object.isRequired,
    history: PropTypes.shape({
      push: PropTypes.func.isRequired,
    }).isRequired,
  };

  constructor(props) {
    super(props);
    this.ref = React.createRef();
  }

  render() {
    const keys = { cancel: ['escape'] };
    const handlers = { cancel: () => this.props.history.push('details') };

    return (
      <HotKeys keyMap={keys} handlers={handlers}>
        <div className={css.buttonBar}>
          <div className={css.cancelIcon}>
            <FormattedMessage id="ui-rs.button.cancel-print">
              {ariaLabel => (
                <PaneHeaderIconButton
                  icon="times"
                  to="details"
                  aria-label={ariaLabel}
                />
              )}
            </FormattedMessage>
          </div>
          <ReactToPrint
            trigger={() => (
              <Button data-test-print-pull-slip marginBottom0>
                <FormattedMessage id="ui-rs.button.print" />
              </Button>
            )}
            content={() => this.ref.current}
          />
        </div>
        <div ref={this.ref}>
          <PullSlip record={this.props.record} />
        </div>
      </HotKeys>
    );
  }
}

export default withRouter(PrintPullSlip);
