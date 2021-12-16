import React, { useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';
import { Route, Switch } from 'react-router-dom';

import { useStripes } from '@folio/stripes/core';
import { Button, ButtonGroup, Icon, Layout, Pane, PaneMenu, Paneset } from '@folio/stripes/components';
import { DirectLink, usePerformAction, useOkapiQuery } from '@reshare/stripes-reshare';

import upNLevels from '../util/upNLevels';
import renderNamedWithProps from '../util/renderNamedWithProps';
import { MessageModalProvider } from '../components/MessageModalState';
import * as modals from '../components/Flow/modals';
import { actionsForRequest } from '../components/Flow/actionsByState';
import AppNameContext from '../AppNameContext';
import FlowRoute from './FlowRoute';
import ViewPatronRequest from '../components/ViewPatronRequest';
import ViewMessageBanners from '../components/ViewMessageBanners';
import useRSHelperApp from '../components/useRSHelperApp';
import useChatActions from '../components/chat/useChatActions';

import css from './ViewRoute.css';

const subheading = (req, params) => {
  if (!req || params.id !== req.id) return undefined;
  const title = _.get(req, 'title');
  if (!title) return undefined;
  const requester = _.get(req, 'resolvedRequester.owner.slug', '');
  if (!requester) return title;
  const supplier = _.get(req, 'resolvedSupplier.owner.slug', '');
  return `${title} · ${requester} → ${supplier}`;
};

const ViewRoute = ({ history, location, location: { pathname }, match }) => {
  const id = match.params?.id;
  const stripes = useStripes();
  const { ChatButton, HelperComponent, TagButton, isOpen } = useRSHelperApp();
  const appName = useContext(AppNameContext);
  const performAction = usePerformAction(id);
  const { handleMarkAllRead } = useChatActions(id);

  // Fetch the request
  const { data: request = {}, isSuccess: hasRequestLoaded } = useOkapiQuery(`rs/patronrequests/${id}`, { staleTime: 2 * 60 * 1000 });

  /* On mount ONLY we want to check if the helper is open, and if so then mark all messages as read.
   * If this useEffect is handed dependencies handleMarkAllRead and isOpen then it will infinitely loop,
   */

  useEffect(() => {
    if (isOpen('chat')) {
      handleMarkAllRead(true, true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paneButtons = () => {
    return (
      <PaneMenu>
        {request?.resolvedSupplier &&
          <ChatButton
            request={request}
            onClick={({ open }) => {
              if (!open) {
                handleMarkAllRead(true, true);
              }
            }}
          />
        }
        <TagButton request={request} />
      </PaneMenu>
    );
  };


  if (!hasRequestLoaded) return null;
  const forCurrent = actionsForRequest(request);

  return (
    <>
      <Paneset>
        {/* TODO: The "Request" string is translated as ui-rs.view.title which we can use conveniently with a hook once react-intl is upgraded */}
        <Pane
          centerContent
          paneTitle={`Request ${request.hrid}`}
          paneSub={subheading(request, match.params)}
          padContent={false}
          onClose={() => history.push(upNLevels(location, 3))}
          dismissible
          lastMenu={paneButtons()}
          defaultWidth="fill"
          subheader={
            <Layout
              className={`${css.tabContainer} flex centerContent flex-align-items-center full padding-start-gutter padding-end-gutter`}
            >
              <ButtonGroup>
                <Button
                  marginBottom0
                  to={`${match.url}/flow${location.search}`}
                  buttonStyle={pathname.includes('/flow') ? 'primary' : 'default'}
                  replace
                >
                  <FormattedMessage id="ui-rs.flow.flow" />
                </Button>
                <Button
                  marginBottom0
                  to={`${match.url}/details${location.search}`}
                  buttonStyle={pathname.includes('/details') ? 'primary' : 'default'}
                  replace
                >
                  <FormattedMessage id="ui-rs.flow.details" />
                </Button>
              </ButtonGroup>
            </Layout>
          }
          actionMenu={() => (
            <>
              {
                appName === 'request' && stripes.hasPerm(`ui-${appName}.edit`) && (
                  <Button buttonStyle="dropdownItem" to={`../../edit/${match.params.id}`} id="clickable-edit-patronrequest">
                    <Icon icon="edit">
                      <FormattedMessage id="ui-rs.edit" />
                    </Icon>
                  </Button>
                )
              }
              <DirectLink component={Button} buttonStyle="dropdownItem" to={{ pathname: 'pullslip', search: location.search }} id="clickable-pullslip">
                <Icon icon="print">
                  <FormattedMessage id="ui-rs.printPullslip" />
                </Icon>
              </DirectLink>
            </>
          )}
        >
          <ViewMessageBanners request={request} />
          <Switch>
            <Route path={`${match.path}/details`} render={() => <ViewPatronRequest record={request} />} />
            <Route path={`${match.path}/flow`} render={() => <FlowRoute request={request} performAction={performAction} />} />
          </Switch>
        </Pane>
        <HelperComponent request={request} isOpen={isOpen} />
      </Paneset>
      {/* Render modals that correspond to available actions */}
      {renderNamedWithProps(
        forCurrent.primaryAction && !forCurrent.moreActions.includes(forCurrent.primaryAction)
          ? [forCurrent.primaryAction, ...forCurrent.moreActions]
          : forCurrent.moreActions,
        modals,
        { request, performAction }
      )}
    </>
  );
};

ViewRoute.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.object,
    url: PropTypes.string,
  }).isRequired,
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string.isRequired,
  }).isRequired,
  history: PropTypes.object.isRequired,
};

const ConnectedViewRoute = ViewRoute;

const ViewRouteWithContext = props => (
  <MessageModalProvider>
    <ConnectedViewRoute {...props} />
  </MessageModalProvider>
);

export default ViewRouteWithContext;
