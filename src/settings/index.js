import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Settings } from '@folio/stripes/smart-components';
import { stripesConnect } from '@folio/stripes/core';
import SettingPage from './SettingPage';
import { CustomISO18626 } from './settingsComponents';


function sortByLabelCaseInsensitive(a, b) {
  const al = a.label.toLowerCase();
  const bl = b.label.toLowerCase();
  return (al < bl) ? -1 : (al > bl) ? 1 : 0;
}


class ResourceSharingSettings extends React.Component {
  static manifest = Object.freeze({
    settings: {
      type: 'okapi',
      path: 'rs/settings/appSettings',
      params: {
        max: '500',
      },
    },
  });

  static propTypes = {
    resources: PropTypes.shape({
      settings: PropTypes.shape({
        records: PropTypes.array
      })
    }),
    intl: PropTypes.shape({
      formatMessage: PropTypes.func.isRequired,
    }).isRequired,
  };

  persistentPages = [
    {
      route: 'CustomISO18626Settings',
      id: 'iso18626',
      component: CustomISO18626
    }
  ];

  pageList() {
    const { intl } = this.props;
    const rows = (this.props.resources.settings || {}).records || [];
    const sections = Array.from(new Set(rows.map(obj => obj.section)));

    const persistent = this.persistentPages.map(page => ({
      route: page.route,
      label: intl.formatMessage({ id: `ui-rs.settingsSection.${page.id}` }),
      component: page.component,
    }));

    const dynamic = sections.map(section => ({
      route: section,
      label: intl.formatMessage({ id: `ui-rs.settingsSection.${section}` }),
      component: (props) => <SettingPage sectionName={section} {...props} />,
    }));

    return persistent.concat(dynamic).sort(sortByLabelCaseInsensitive);
  }

  render() {
    const pageList = this.pageList();
    if (pageList.length === this.persistentPages.length) return null; // XXX Removing this line breaks the render!
    return <Settings {...this.props} pages={pageList} paneTitle={<FormattedMessage id="ui-rs.meta.title" />} />;
  }
}

export default injectIntl(stripesConnect(ResourceSharingSettings));
