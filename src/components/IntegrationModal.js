import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import '../index.css';

import { HiPlus } from 'react-icons/hi';
import CarbonAnnouncement from '../components/CarbonAnnouncement';
import ThirdPartyList from '../components/ThirdPartyList';
import FileUpload from '../components/FileUpload';
import { ToastContainer } from 'react-toastify';

import { BASE_URL, onSuccessEvents } from '../constants';
import { useCarbon } from '../contexts/CarbonContext';
import WebScraper from '../components/WebScraper';
import ZendeskScreen from './ZendeskScreen';
import SharepointScreen from './SharepointScreen';
import ConfluenceScreen from './ConfluenceScreen';
import ThirdPartyHome from './ThirdPartyHome';
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
}) => {
  const [activeIntegrations, setActiveIntegrations] = useState([]);

  const activeIntegrationsRef = useRef(activeIntegrations);
  const firstFetchCompletedRef = useRef(false);

  const {
    accessToken,
    fetchTokens,
    authenticatedFetch,
    setOpen,
    alwaysOpen,
    showModal,
    manageModalOpenState,
  } = useCarbon();

  const findModifications = (newIntegrations, oldIntegrations) => {
    const response = [];
    try {
      for (let i = 0; i < newIntegrations.length; i++) {
        const newIntegration = newIntegrations[i];

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
              files: null,
              sync_status: newIntegration.sync_status,
            },
          };

          response.push(onSuccessObject);

          // TODO: Remove this once we have the BE code ready
          // START
          const requestBody = {
            data_source_id: newIntegration.id,
          };

          authenticatedFetch(
            `${BASE_URL[environment]}/integrations/items/sync`,
            {
              method: 'POST',
              headers: {
                Authorization: `Token ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            }
          );
          // END

          if (
            newIntegration?.data_source_type === 'NOTION' ||
            newIntegration?.data_source_type === 'INTERCOM'
          ) {
            // setFlag(newIntegration?.data_source_type, false);
            const onSuccessObject = {
              status: 200,
              integration: newIntegration.data_source_type,
              action: onSuccessEvents.UPDATE,
              event: onSuccessEvents.UPDATE,
              data: {
                data_source_external_id: newIntegration.data_source_external_id,
                files: newIntegration?.synced_files || [],
                sync_status: newIntegration.sync_status,
              },
            };
            response.push(onSuccessObject);
          }
          // setFlag(newIntegration?.data_source_type, false);
          // continue;
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
              files: null, //newIntegration?.synced_files || [],
              sync_status: newIntegration.sync_status,
            },
          };
          // setFlag(newIntegration?.data_source_type, false);
          response.push(onSuccessObject);
          continue;
        } else if (
          oldIntegration?.last_synced_at !== newIntegration?.last_synced_at &&
          newIntegration?.last_sync_action === 'UPDATE'
        ) {
          const newFiles = newIntegration?.synced_files || [];
          const oldFiles = oldIntegration?.synced_files || [];

          const additions = [];
          const deletions = [];
          const reselections = [];
          for (let j = 0; j < newFiles.length; j++) {
            const newFileObject = newFiles[j];
            const oldFileObject = oldFiles.find(
              (oldFile) => oldFile.id === newFileObject.id
            );

            if (!oldFileObject) {
              additions.push({ ...newFileObject, action: onSuccessEvents.ADD });
              continue;
            }
            if (oldFileObject.updated_at !== newFileObject.updated_at) {
              reselections.push({
                ...newFileObject,
                action: onSuccessEvents.UPDATE,
              });
            }
          }

          for (let j = 0; j < oldFiles.length; j++) {
            const oldFileObject = oldFiles[j];
            const newFileObject = newFiles.find(
              (newFile) => newFile.id === oldFileObject.id
            );

            if (!newFileObject) {
              deletions.push({
                ...oldFileObject,
                action: onSuccessEvents.REMOVE,
              });
            }
          }

          const fileModifications = [
            ...additions,
            ...reselections,
            ...deletions,
          ];

          if (fileModifications.length > 0) {
            const onSuccessObject = {
              status: 200,
              integration: newIntegration.data_source_type,
              action: onSuccessEvents.UPDATE,
              event: onSuccessEvents.UPDATE,
              data: {
                data_source_external_id: newIntegration.data_source_external_id,
                files: fileModifications,
                sync_status: newIntegration.sync_status,
              },
            };
            // setFlag(newIntegration?.data_source_type, false);
            response.push(onSuccessObject);
          }
        }
      }

      return response;
    } catch (error) {}
  };

  const fetchUserIntegrationsHelper = async () => {
    try {
      const userIntegrationsResponse = await authenticatedFetch(
        `${BASE_URL[environment]}/integrations/`,
        {
          method: 'GET',
          headers: {
            Authorization: `Token ${accessToken}`,
          },
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
      // console.log(error);
    }
  };

  useEffect(() => {
    activeIntegrationsRef.current = activeIntegrations;
  }, [activeIntegrations]);

  const fetchUserIntegrations = async () => {
    try {
      await fetchUserIntegrationsHelper();
    } catch (error) {}
  };

  useEffect(() => {
    if (accessToken && showModal) {
      fetchUserIntegrations();
      // Then set up the interval to call it every 5 seconds
      const intervalId = setInterval(fetchUserIntegrations, 5000); // 5000 ms = 5 s
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
          className={`cc-flex cc-flex-col data-[state=open]:cc-animate-contentShow cc-fixed cc-top-[50%] cc-left-[50%] cc-translate-x-[-50%] cc-translate-y-[-50%] cc-rounded-[6px] cc-bg-white focus:cc-outline-none ${
            activeStep === 0
              ? 'cc-w-full cc-h-full sm:cc-w-[350px] sm:cc-h-[600px]'
              : 'cc-w-full cc-h-full sm:cc-w-1/2 sm:cc-h-2/3 sm:cc-max-w-2xl'
          }`}
          style={{ zIndex: zIndex }}
        >
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

          {[
            'BOX',
            'CONFLUENCE',
            'DROPBOX',
            'GOOGLE_DRIVE',
            'INTERCOM',
            // 'LOCAL_FILES',
            'NOTION',
            'ONEDRIVE',
            'SHAREPOINT',
            // 'WEB_SCRAPER',
            'ZENDESK',
            'ZOTERO',
          ].includes(activeStep) && (
            <ThirdPartyHome
              activeIntegrations={activeIntegrations}
              integrationName={activeStep}
              setActiveStep={setActiveStep}
            />
          )}

          {activeStep === 'LOCAL_FILES' && (
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
          )}

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
