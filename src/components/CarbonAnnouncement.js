import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { HiLockClosed, HiLink, HiX } from 'react-icons/hi';
import '../index.css';
import carbonLogo from '../carbon.svg';
import { useCarbon } from '../contexts/CarbonContext';
import { darkenColor } from '../utils/helpers';
import * as Dialog from '@radix-ui/react-dialog';
import { LuLoader } from "react-icons/lu";

const Feature = ({ Icon, title, children }) => (
  <li className="cc-flex cc-flex-row cc-items-start cc-w-full cc-space-x-2 cc-py-2 cc-px-4 cc-text-black">
    <div className="cc-w-1/12">
      <Icon className="cc-w-6 cc-h-6 cc-mr-1 cc-text-gray-400" />
    </div>
    {/* <div className="cc-w-1/12"></div> */}
    <div className="cc-flex cc-flex-col cc-gap-y-1 cc-w-10/12">
      <h1 className="cc-text-base cc-font-medium">{title}</h1>
      <p className="cc-text-sm cc-font-normal cc-text-gray-400">{children}</p>
    </div>
  </li>
);

Feature.propTypes = {
  Icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

const CarbonAnnouncement = ({ setActiveStep, activeIntegrations }) => {
  const [connectButtonHoveredState, setConnectButtonHoveredState] =
    useState(false);

  const {
    orgName,
    brandIcon,
    primaryBackgroundColor,
    primaryTextColor,
    loadingIconColor,
    secondaryBackgroundColor,
    secondaryTextColor,
    entryPoint,
    entryPointIntegrationObject,
    handleServiceOAuthFlow,
    whiteLabelingData,
    tosURL,
    privacyPolicyURL,
    navigateBackURL,
    manageModalOpenState,
    backButtonText,
    loading: whiteLabelDataLoading
  } = useCarbon();

  const isEntryPoint = Boolean(entryPoint);
  const isWhiteLabeledOrg = Boolean(whiteLabelingData?.remove_branding);
  const isWhiteLabeledEntryPoint = Boolean(
    isEntryPoint &&
    whiteLabelingData?.integrations &&
    whiteLabelingData?.integrations?.[entryPoint]
  );

  const handleButtonClick = () => {
    if (entryPointIntegrationObject?.active) {
      setActiveStep(entryPointIntegrationObject.data_source_type);
    } else {
      setActiveStep(1);
    }
  };

  const navigateBack = () => {
    if (navigateBackURL) window.open(navigateBackURL, '_self');
    else manageModalOpenState(false);
  };

  return (
    <div className="cc-flex cc-flex-col cc-items-center cc-relative cc-h-full">
      {whiteLabelDataLoading ?
        <div class="cc-flex cc-justify-center cc-items-center cc-h-full">
          <div class="cc-relative cc-inline-flex">
            <div class="cc-w-8 cc-h-8 cc-rounded-full" style={{ "background-color": loadingIconColor }}></div>
            <div class="cc-w-8 cc-h-8 cc-rounded-full cc-absolute cc-top-0 cc-left-0 cc-animate-ping" style={{ "background-color": loadingIconColor }}></div>
            <div class="cc-w-8 cc-h-8 cc-rounded-full cc-absolute cc-top-0 cc-left-0 cc-animate-pulse" style={{ "background-color": loadingIconColor }}></div>
          </div>
        </div> :
        (<div className="cc-flex cc-flex-col cc-h-full cc-items-center cc-justify-between cc-p-6">
          <div className="cc-flex cc-pt-8 -cc-space-x-2">
            <img
              src={brandIcon}
              alt={`${orgName} Icon`}
              className="cc-rounded-full cc-border cc-w-16"
            />
            {!isWhiteLabeledOrg && (
              <img
                src={carbonLogo}
                alt="Carbon Icon"
                className="cc-rounded-full cc-border cc-w-16"
              />
            )}
          </div>
          {isWhiteLabeledOrg ? (
            <div className="cc-text-xl cc-font-light cc-w-full cc-flex cc-justify-center cc-items-center cc-text-center">
              <div>
                <span className="cc-font-normal">{orgName}</span>
                <span> wants to access your data </span>
                {entryPointIntegrationObject?.announcementName && (
                  <>
                    <span>on</span>
                    <span className="cc-font-normal">
                      {` ${entryPointIntegrationObject?.name}`}
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="cc-text-xl cc-font-light cc-w-full cc-flex cc-justify-center cc-items-center cc-text-center">
              <div>
                <span className="cc-font-normal">{orgName}</span>
                <span> uses </span>
                <span className="cc-font-normal">Carbon </span>
                <span>
                  to connect{' '}
                  {entryPointIntegrationObject?.announcementName ? (
                    <span className="cc-font-normal">
                      {entryPointIntegrationObject?.name}
                    </span>
                  ) : (
                    <span>your data</span>
                  )}
                </span>
              </div>
            </div>
          )}
          <ul className="">
            <Feature Icon={HiLockClosed} title="Private">
              Your credentials will never be made available to {orgName}
            </Feature>
            <Feature Icon={HiLink} title="Secure">
              {isWhiteLabeledOrg
                ? `By connecting, your data is securely shared with ${orgName} and 3rd parties like OpenAI.`
                : `By connecting with Carbon, your data is securely shared with ${orgName} and 3rd parties like OpenAI.`}
            </Feature>
          </ul>
          <div className="cc-flex cc-flex-col cc-space-y-3 cc-w-full cc-items-center">
            {isWhiteLabeledOrg ? (
              <p className="cc-text-xs cc-text-center cc-text-gray-400">
                {`By continuing, you agree to ${isWhiteLabeledEntryPoint ? orgName + "'s" : 'the following'
                  }`}

                <br></br>
                <a
                  href={tosURL || 'https://carbon.ai/terms'}
                  target="_blank"
                  className="cc-cursor-pointer"
                >
                  <u>Terms of Service</u>
                </a>
                {` and `}
                <a
                  href={privacyPolicyURL || 'https://carbon.ai/privacy'}
                  target="_blank"
                  className="cc-cursor-pointer"
                >
                  <u>Privacy Policy</u>
                </a>
                {`.`}
              </p>
            ) : (
              <p className="cc-text-xs cc-text-center cc-text-gray-400">
                {`By continuing, you agree to Carbon's`}
                <br></br>
                <a
                  href="https://carbon.ai/terms"
                  target="_blank"
                  className="cc-cursor-pointer"
                >
                  <u>Terms of Service</u>
                </a>
                {` and `}
                <a
                  href="https://carbon.ai/privacy"
                  target="_blank"
                  className="cc-cursor-pointer"
                >
                  <u>Privacy Policy</u>
                </a>
                {`.`}
              </p>
            )}

            <button
              className="cc-w-full cc-h-12 cc-flex cc-flex-row cc-items-center cc-justify-center cc-rounded-md cc-cursor-pointer"
              style={{
                backgroundColor: connectButtonHoveredState
                  ? darkenColor(primaryBackgroundColor, -10)
                  : primaryBackgroundColor,

                color: primaryTextColor,
              }}
              onClick={handleButtonClick}
              onMouseEnter={() => setConnectButtonHoveredState(true)}
              onMouseLeave={() => setConnectButtonHoveredState(false)}
            >
              <p>Connect</p>
            </button>


            {navigateBackURL && (
              <p
                className="cc-flex cc-flex-row cc-items-center cc-justify-center cc-cursor-pointer cc-text-xs hover:cc-underline"
                style={{
                  color: secondaryTextColor,
                }}
                onClick={navigateBack}
              >
                {backButtonText || 'Go back'}
              </p>
            )}
          </div>
        </div>)
      }
    </div>
  );
};

CarbonAnnouncement.propTypes = {
  setActiveStep: PropTypes.func.isRequired,
};

export default CarbonAnnouncement;
