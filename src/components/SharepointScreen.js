import React, { useEffect, useState } from 'react';

import { darkenColor } from '../utils/helpers';

import * as Dialog from '@radix-ui/react-dialog';
import { HiArrowLeft, HiUpload, HiInformationCircle } from 'react-icons/hi';
import { SiMicrosoftsharepoint } from 'react-icons/si';
import { toast } from 'react-toastify';

import '../index.css';
import { BASE_URL, onSuccessEvents } from '../constants';
import { LuLoader2 } from 'react-icons/lu';
import { useCarbon } from '../contexts/CarbonContext';

function SharepointScreen({ buttonColor, labelColor }) {
  const [microsoftTenant, setMicrosoftTenant] = useState('');
  const [sharepointSiteName, setSharepointSiteName] = useState('');

  const [submitButtonHoveredState, setSubmitButtonHoveredState] =
    useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [service, setService] = useState(null);

  useEffect(() => {
    setService(
      processedIntegrations.find(
        (integration) => integration.id === 'SHAREPOINT'
      )
    );
  }, [processedIntegrations]);

  const {
    accessToken,
    processedIntegrations,
    topLevelChunkSize,
    topLevelOverlapSize,
    defaultChunkSize,
    defaultOverlapSize,
    authenticatedFetch,
    secondaryBackgroundColor,
    secondaryTextColor,
    setActiveStep,
    entryPoint,
    environment,
    tags,
    onSuccess,
    onError,
    primaryBackgroundColor,
    primaryTextColor,
    embeddingModel,
    generateSparseVectors,
    prependFilenameToChunks,
    maxItemsPerChunk
  } = useCarbon();

  const fetchOauthURL = async () => {
    try {
      if (!microsoftTenant) {
        toast.error('Please enter a tenant value.');
        return;
      }

      if (!sharepointSiteName) {
        toast.error('Please enter a sitename value.');
        return;
      }

      const oauthWindow = window.open('', '_blank');
      oauthWindow.document.write('Loading...');
      setIsLoading(true);

      const chunkSize =
        service?.chunkSize || topLevelChunkSize || defaultChunkSize;
      const overlapSize =
        service?.overlapSize || topLevelOverlapSize || defaultOverlapSize;
      const skipEmbeddingGeneration = service?.skipEmbeddingGeneration || false;
      const tenant = microsoftTenant;
      const sitename = sharepointSiteName;
      const embeddingModelValue =
        service?.embeddingModel || embeddingModel || null;
      const generateSparseVectorsValue =
        service?.generateSparseVectors || generateSparseVectors || false;
      const prependFilenameToChunksValue =
        service?.prependFilenameToChunks || prependFilenameToChunks || false;
      const maxItemsPerChunkValue = service?.maxItemsPerChunk || maxItemsPerChunk || null;

      const requestObject = {
        tags: tags,
        service: service?.data_source_type,
        chunk_size: chunkSize,
        chunk_overlap: overlapSize,
        skip_embedding_generation: skipEmbeddingGeneration,
        microsoft_tenant: tenant,
        sharepoint_site_name: sitename,
        embedding_model: embeddingModelValue,
        generate_sparse_vectors: generateSparseVectorsValue,
        prepend_filename_to_chunks: prependFilenameToChunksValue,
        ...(maxItemsPerChunkValue && { max_items_per_chunk: maxItemsPerChunkValue }),
        connecting_new_account: true
      };

      const response = await authenticatedFetch(
        `${BASE_URL[environment]}/integrations/oauth_url`,
        {
          method: 'POST',
          headers: {
            Authorization: `Token ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestObject),
        }
      );

      const oAuthURLResponseData = await response.json();

      if (response.status === 200) {
        onSuccess({
          status: 200,
          data: null,
          action: onSuccessEvents.INITIATE,
          event: onSuccessEvents.INITIATE,
          integration: 'SHAREPOINT',
        });
        oauthWindow.location.href = oAuthURLResponseData.oauth_url;
      } else {
        oauthWindow.document.body.innerHTML = oAuthURLResponseData.detail;
      }
      setIsLoading(false);
    } catch (error) {
      toast.error('Error getting oAuth URL. Please try again.');
      setIsLoading(false);
      onError({
        status: 400,
        data: [{ message: 'Error getting oAuth URL. Please try again.' }],
        action: onSuccessEvents.ERROR,
        event: onSuccessEvents.ERROR,
        integration: 'SHAREPOINT',
      });
    }
  };

  return (
    <div className="cc-flex cc-flex-col  cc-py-4 cc-justify-between cc-h-full">
      <div className="py-4 cc-flex cc-grow cc-w-full">
        <div className="cc-flex cc-flex-col cc-justify-start cc-h-full cc-items-start cc-w-full cc-space-y-4">
          <span className="cc-text-sm">
            Please enter the <strong>Sharepoint</strong>{' '}
            <span className="cc-bg-gray-200 cc-px-1 cc-py-0.5 cc-rounded cc-font-mono cc-text-red-400">
              tenant
            </span>{' '}
            and the{' '}
            <span className="cc-bg-gray-200 cc-px-1 cc-py-0.5 cc-rounded cc-font-mono cc-text-red-400">
              site name
            </span>{' '}
            of the account you wish to connect.
          </span>

          <div className="cc-flex cc-space-x-2 cc-items-center cc-w-full cc-h-10">
            <input
              type="text"
              className="cc-p-2 cc-flex-grow cc-text-gray-700 cc-text-sm cc-border-4 cc-border-gray-400"
              style={{ borderRadius: '0.375rem' }}
              placeholder="Your Tenant Name"
              value={microsoftTenant}
              onChange={(e) => setMicrosoftTenant(e.target.value)}
            />
          </div>
          <div className="cc-flex cc-space-x-2 cc-items-center cc-w-full cc-h-10">
            <input
              type="text"
              className="cc-p-2 cc-flex-grow cc-text-gray-700 cc-text-sm cc-border-4 cc-border-gray-400"
              style={{ borderRadius: '0.375rem' }}
              placeholder="Your Site Name"
              value={sharepointSiteName}
              onChange={(e) => setSharepointSiteName(e.target.value)}
            />
          </div>
        </div>
      </div>
      <>
        <p
          className="cc-flex cc-text-gray-500 cc-p-2 cc-space-x-2 cc-bg-gray-100 cc-rounded-md cc-mb-2 cc-items-center"
          style={{
            color: secondaryTextColor,
            backgroundColor: secondaryBackgroundColor,
          }}
        >
          <HiInformationCircle className="cc-w-8 cc-h-8" />
          <span className="text-xs">
            By connecting to Sharepoint, you are providing us with access to
            your Sharepoint profile and content.
          </span>
        </p>
        <button
          className={`cc-w-full cc-h-12 cc-flex cc-flex-row cc-items-center cc-justify-center cc-rounded-md cc-cursor-pointer cc-space-x-2`}
          style={{
            backgroundColor: submitButtonHoveredState
              ? darkenColor(buttonColor, -10)
              : buttonColor,
            color: labelColor,
          }}
          onClick={fetchOauthURL}
          onMouseEnter={() => setSubmitButtonHoveredState(true)}
          onMouseLeave={() => setSubmitButtonHoveredState(false)}
        >
          {isLoading ? (
            <LuLoader2 className={`cc-animate-spin`} />
          ) : (
            <HiUpload />
          )}
          <p>Connect</p>
        </button>
      </>
    </div>
  );
}

export default SharepointScreen;
