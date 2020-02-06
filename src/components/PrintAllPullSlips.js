import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router';
import includes from 'lodash/includes';
import { withStripes } from '@folio/stripes/core';
import { Callout } from '@folio/stripes/components';
import AllPullSlips from './PullSlip/AllPullSlips';
import PrintOrCancel from './PrintOrCancel';
import upNLevels from '../util/upNLevels';


// Should be a utility
function okapiFetch(stripes, path, options) {
  const { tenant, token, url } = stripes.okapi;

  const allOptions = Object.assign({}, {
    headers: {
      'X-Okapi-Tenant': tenant,
      'X-Okapi-Token': token,
    },
  }, options);

  return fetch(`${url}/x${path}`, allOptions);
}


// Should be a utility
function okapiFetchData(stripes, path, options) {
  return okapiFetch(stripes, path, options)
    .then(r => {
      if (!r.ok) {
        const messgae = `Protocol failure in marking slip as printed: status ${r.status} ${r.statusText}`;
        console.log(message);
        throw new Error(message);
      }
      console.log('r =', r);
      return r.text().then(data => {
        console.log('data =', data);
        return data;
      });
    });
}


class PrintAllPullSlips extends React.Component {
  static propTypes = {
    records: PropTypes.shape({
      hasLoaded: PropTypes.bool.isRequired,
      other: PropTypes.shape({
        totalRecords: PropTypes.number,
      }),
      records: PropTypes.arrayOf(
        PropTypes.object.isRequired,
      ),
    }).isRequired,
    location: PropTypes.shape({
      search: PropTypes.string.isRequired,
    }).isRequired,
    stripes: PropTypes.object,
  };

  constructor() {
    super();
    this.callout = React.createRef();
  }

  componentDidMount() {
    this.markAllPrintableAsPrinted();
  }

  showCallout(type, message) {
    this.callout.current.sendCallout({ type, message });
  }

  markAllPrintableAsPrinted = () => {
    const promises = [];

    this.props.records.records.forEach(record => {
      if (true || includes(record.validActions, 'supplierPrintPullSlip')) {
        const path = `rs/patronrequests/${record.id}/performAction`;
        const p = okapiFetchData(this.props.stripes, path, {
          method: 'POST',
          body: JSON.stringify({ action: 'supplierPrintPullSlip' }),
        });
        promises.push(p);
      }
    });

    Promise.all(promises)
      .then((json) => {
        console.log('json =', json);
        if (json.status) {
          this.showCallout('success', 'All slips marked as printed.');
        } else {
          // eslint-disable-next-line react/jsx-one-expression-per-line
          this.showCallout('error', <span>Some slips <b>not</b> marked as printed: {json.message}</span>);
        }
      })
      .catch((exception) => {
        this.showCallout('error', `Protocol failure in marking slips as printed: ${exception}`);
      });
  }

  render() {
    const { hasLoaded, other, records } = this.props.records;

    if (!hasLoaded) {
      return 'Record not yet loaded for printing';
    }

    const totalRecords = other.totalRecords;
    if (records.length < totalRecords) {
      return `Not enough records loaded for printing (${records.length} of ${totalRecords})`;
    }

    return (
      <React.Fragment>
        <PrintOrCancel destUrl={upNLevels(this.props.location, 1)}>
          <AllPullSlips records={records} />
        </PrintOrCancel>
        <Callout ref={this.callout} />
      </React.Fragment>
    );
  }
}

export default withStripes(withRouter(PrintAllPullSlips));
