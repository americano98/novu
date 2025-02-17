import { useState } from 'react';
import styled from '@emotion/styled';
import { ChannelTypeEnum } from '@novu/shared';

import { Text } from '../../../design-system';
import { CircleArrowRight } from '../../../design-system/icons/arrows/CircleArrowRight';
import { IntegrationsStoreModal } from '../../integrations/IntegrationsStoreModal';
import { useSegment } from '../../../components/providers/SegmentProvider';
import { stepNames, TemplateEditorAnalyticsEnum } from '../constants';
import { useIsMultiProviderConfigurationEnabled } from '../../../hooks';
import { IntegrationsListModal } from '../../integrations/IntegrationsListModal';

const DoubleArrowRightStyled = styled(CircleArrowRight)`
  cursor: pointer;
`;

export function LackIntegrationError({
  channelType,
  text,
  iconHeight = 18,
  iconWidth = 18,
}: {
  channelType: ChannelTypeEnum;
  text?: string;
  iconHeight?: number | string | undefined;
  iconWidth?: number | string | undefined;
}) {
  const segment = useSegment();
  const [isIntegrationsModalOpened, openIntegrationsModal] = useState(false);
  const isMultiProviderConfigurationEnabled = useIsMultiProviderConfigurationEnabled();

  const onIntegrationModalClose = () => openIntegrationsModal(false);

  return (
    <>
      <WarningMessage>
        <Text>
          {text
            ? text
            : 'Looks like you haven’t configured your ' +
              stepNames[channelType] +
              ' provider yet, this channel will be disabled until you configure it.'}
        </Text>
        <DoubleArrowRightStyled
          onClick={() => {
            openIntegrationsModal(true);
            segment.track(TemplateEditorAnalyticsEnum.CONFIGURE_PROVIDER_BANNER_CLICK);
          }}
          height={iconHeight}
          width={iconWidth}
        />
      </WarningMessage>
      {isMultiProviderConfigurationEnabled ? (
        <IntegrationsListModal
          isOpen={isIntegrationsModalOpened}
          onClose={onIntegrationModalClose}
          scrollTo={channelType}
        />
      ) : (
        <IntegrationsStoreModal
          openIntegration={isIntegrationsModalOpened}
          closeIntegration={onIntegrationModalClose}
          scrollTo={channelType}
        />
      )}
    </>
  );
}

const WarningMessage = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  margin-bottom: 40px;
  color: #e54545;

  background: rgba(230, 69, 69, 0.15);
  border-radius: 7px;
`;
