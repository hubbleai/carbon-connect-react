import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { IoClose } from "react-icons/io5";
import '../index.css';

import { HiPlus } from 'react-icons/hi';
import CarbonAnnouncement from '../components/CarbonAnnouncement';
import ThirdPartyList from '../components/ThirdPartyList';
import FileUpload from '../components/FileUpload';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { BASE_URL, onSuccessEvents, THIRD_PARTY_CONNECTORS } from '../constants';
import { useCarbon } from '../contexts/CarbonContext';
import WebScraper from '../components/WebScraper';
import ZendeskScreen from './ZendeskScreen';
import SharepointScreen from './SharepointScreen';
import ConfluenceScreen from './ConfluenceScreen';
import ThirdPartyHome from './ThirdPartyHome';
import LocalFilesScreen from "./LocalFilesScreen";
// import { setFlag } from '../utils/helpers';

const IntegrationModal = ({
  maxFileSize,
  children,
  onSuccess,
  onError,
  primaryBackgroundColor,
  primaryTextColor,
  secondaryBackgroundColor,
  secondaryTextColor,
  allowMultipleFiles,
  tags = {},
  environment = 'PRODUCTION',
  entryPoint = null,
  activeStep,
  setActiveStep,
  zIndex = 1000,
  enableToasts = true,
  requestIds
}) => {
  const [activeIntegrations, setActiveIntegrations] = useState([]);

  const activeIntegrationsRef = useRef(activeIntegrations);
  const requestIdsRef = useRef(requestIds);
  const firstFetchCompletedRef = useRef(false);

  const {
    accessToken,
    fetchTokens,
    authenticatedFetch,
    setOpen,
    alwaysOpen,
    showModal,
    manageModalOpenState,
    setShowModal
  } = useCarbon();

  const findModifications = (newIntegrations, oldIntegrations) => {
    const response = [];
    try {
      for (let i = 0; i < newIntegrations.length; i++) {
        const newIntegration = newIntegrations[i];
        const requestId = requestIdsRef.current ?
          requestIdsRef.current[newIntegration.data_source_type] || null :
          null

        const oldIntegration = oldIntegrations.find(
          (oldIntegration) => oldIntegration.id === newIntegration.id
        );
        if (!oldIntegration) {
          const onSuccessObject = {
            status: 200,
            integration: newIntegration.data_source_type,
            action: onSuccessEvents.ADD,
            event: onSuccessEvents.ADD,
            data: {
              data_source_external_id: newIntegration.data_source_external_id,
              sync_status: newIntegration.sync_status,
              request_id: requestId
            },
          };

          response.push(onSuccessObject);
        } else if (
          oldIntegration?.last_synced_at !== newIntegration?.last_synced_at &&
          newIntegration?.last_sync_action === 'CANCEL'
        ) {
          const onSuccessObject = {
            status: 200,
            integration: newIntegration.data_source_type,
            action: onSuccessEvents.CANCEL,
            event: onSuccessEvents.CANCEL,
            data: {
              data_source_external_id: newIntegration.data_source_external_id,
              sync_status: newIntegration.sync_status,
            },
          };
          response.push(onSuccessObject);
        } else if (
          oldIntegration?.last_synced_at !== newIntegration?.last_synced_at &&
          newIntegration?.last_sync_action === 'UPDATE'
        ) {
          const requestId = requestIdsRef.current ?
            requestIdsRef.current[newIntegration.data_source_type] || null :
            null
          const filesSynced = oldIntegration?.files_synced_at !== newIntegration?.files_synced_at
          const onSuccessObject = {
            status: 200,
            integration: newIntegration.data_source_type,
            action: onSuccessEvents.UPDATE,
            event: onSuccessEvents.UPDATE,
            data: {
              data_source_external_id: newIntegration.data_source_external_id,
              sync_status: newIntegration.sync_status,
              request_id: requestId,
              files_synced: filesSynced
            },
          };
          response.push(onSuccessObject);
        }
      }

      return response;
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserIntegrationsHelper = async () => {
    try {
      const userIntegrationsResponse = await authenticatedFetch(
        `${BASE_URL[environment]}/integrations/?${new URLSearchParams({ "include_files": false })}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Token ${accessToken}`,
          }
        }
      );

      if (userIntegrationsResponse.status === 200) {
        const responseBody = await userIntegrationsResponse.json();
        if (firstFetchCompletedRef.current) {
          const integrationModifications = findModifications(
            responseBody['active_integrations'],
            activeIntegrationsRef.current
          );

          if (integrationModifications.length > 0) {
            for (let i = 0; i < integrationModifications.length; i++) {
              onSuccess(integrationModifications[i]);
            }
          }
          setActiveIntegrations(responseBody['active_integrations']);
        } else {
          firstFetchCompletedRef.current = true;
          activeIntegrationsRef.current = responseBody['active_integrations'];
          setActiveIntegrations(responseBody['active_integrations']);
        }

        return;
      }
    } catch (error) {
      // console.error(error);
    }
  };

  useEffect(() => {
    activeIntegrationsRef.current = activeIntegrations;
  }, [activeIntegrations]);

  useEffect(() => {
    requestIdsRef.current = requestIds
  }, [requestIds])

  const fetchUserIntegrations = async () => {
    try {
      await fetchUserIntegrationsHelper();
    } catch (error) { }
  };

  useEffect(() => {
    if (accessToken && showModal) {
      fetchUserIntegrations();
      // Then set up the interval to call it every 7.5 seconds
      const intervalId = setInterval(fetchUserIntegrations, 7500);
      // Make sure to clear the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, [accessToken, showModal]);

  useEffect(() => {
    if (!accessToken) {
      fetchTokens();
    }
  }, [accessToken]);

  return (
    <Dialog.Root
      onOpenChange={(modalOpenState) => manageModalOpenState(modalOpenState)}
      open={alwaysOpen ? true : showModal}
    >
      <Dialog.Trigger asChild>
        {setOpen ? null : children ? (
          <div>{children}</div>
        ) : (
          <HiPlus className="cc-w-6 cc-h-6 hover:cc-bg-gray-300 cc-rounded-md cc-p-1 cc-mr-5 cc-cursor-pointer" />
        )}
      </Dialog.Trigger>


      <Dialog.Portal>
        <Dialog.Overlay
          className="cc-bg-blackA9 data-[state=open]:cc-animate-overlayShow cc-fixed cc-inset-0 cc-bg-black/30"
          style={{ zIndex: zIndex - 1 }}
        />
        <Dialog.Content
          className={`cc-flex cc-flex-col data-[state=open]:cc-animate-contentShow cc-fixed cc-top-[50%] cc-left-[50%] cc-translate-x-[-50%] cc-translate-y-[-50%] cc-rounded-[6px] cc-bg-white focus:cc-outline-none ${activeStep === 0
            ? 'cc-w-full cc-h-full sm:cc-w-[350px] sm:cc-h-[600px]'
            : 'cc-w-full cc-h-full sm:cc-w-1/2 sm:cc-h-2/3 sm:cc-max-w-2xl'
            }`}
          style={{ zIndex: zIndex }}
        >
          {!alwaysOpen ? <Dialog.Close asChild style={{ zIndex: zIndex + 1 }}>
            <button aria-label="Close" style={{
              "font-family": "inherit",
              "height": "25px",
              "width": "25px",
              "display": "inline-flex",
              "align-items": "center",
              "justify-content": "center",
              "position": "absolute",
              "top": "15px",
              "right": "15px",
              "cursor": "pointer"
            }} className="cc-text-gray-400">
              <IoClose style={{ height: "1.5rem", width: "1.5rem" }} />
            </button>
          </Dialog.Close> : null}
          {activeStep === 0 && (
            <CarbonAnnouncement
              setActiveStep={setActiveStep}
              activeIntegrations={activeIntegrations}
            />
          )}
          {activeStep === 1 && (
            <ThirdPartyList
              setActiveStep={setActiveStep}
              activeIntegrations={activeIntegrations}
            />
          )}

          {THIRD_PARTY_CONNECTORS.includes(activeStep) && (
            <ThirdPartyHome
              activeIntegrations={activeIntegrations}
              integrationName={activeStep}
              setActiveStep={setActiveStep}
            />
          )}

          {activeStep === 'LOCAL_FILES' && (
            <LocalFilesScreen setActiveStep={setActiveStep} />
          )}

          {
            activeStep == 'FILE_UPLOAD' && (
              <FileUpload
                setActiveStep={setActiveStep}
                entryPoint={entryPoint}
                environment={environment}
                tags={tags}
                maxFileSize={maxFileSize}
                onSuccess={onSuccess}
                onError={onError}
                primaryBackgroundColor={primaryBackgroundColor}
                primaryTextColor={primaryTextColor}
                secondaryBackgroundColor={secondaryBackgroundColor}
                secondaryTextColor={secondaryTextColor}
                allowMultipleFiles={allowMultipleFiles}
              />
            )
          }

          {activeStep === 'WEB_SCRAPER' && (
            <WebScraper
              setActiveStep={setActiveStep}
              entryPoint={entryPoint}
              environment={environment}
              tags={tags}
              maxFileSize={maxFileSize}
              onSuccess={onSuccess}
              onError={onError}
              primaryBackgroundColor={primaryBackgroundColor}
              primaryTextColor={primaryTextColor}
              secondaryBackgroundColor={secondaryBackgroundColor}
              secondaryTextColor={secondaryTextColor}
            />
          )}
        </Dialog.Content>

        {enableToasts && (
          <ToastContainer
            position="bottom-right"
            pauseOnFocusLoss={false}
            pauseOnHover={false}
          />
        )}
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default IntegrationModal;
