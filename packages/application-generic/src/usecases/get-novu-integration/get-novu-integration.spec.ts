import { Test } from '@nestjs/testing';
import * as sinon from 'sinon';
import { endOfMonth, startOfMonth } from 'date-fns';
import { UserSession } from '@novu/testing';
import {
  ChannelTypeEnum,
  EmailProviderIdEnum,
  SmsProviderIdEnum,
} from '@novu/shared';
import {
  MessageRepository,
  IntegrationRepository,
  OrganizationRepository,
} from '@novu/dal';

import { CalculateLimitNovuIntegration } from '../calculate-limit-novu-integration';
import { GetNovuIntegration } from './get-novu-integration.usecase';
import { GetNovuIntegrationCommand } from './get-novu-integration.command';
import { AnalyticsService } from '../../services';

describe('Get Novu Integration', function () {
  let getNovuIntegration: GetNovuIntegration;
  let integrationRepository: IntegrationRepository;
  let messageRepository: MessageRepository;
  let session: UserSession;

  afterEach(() => {
    sinon.restore();
  });

  beforeEach(async () => {
    process.env.NOVU_EMAIL_INTEGRATION_API_KEY = 'true';
    process.env.NOVU_SMS_INTEGRATION_ACCOUNT_SID = 'true';
    process.env.NOVU_SMS_INTEGRATION_TOKEN = 'true';
    process.env.NOVU_SMS_INTEGRATION_SENDER = '1234567890';

    const moduleRef = await Test.createTestingModule({
      imports: [
        GetNovuIntegration,
        IntegrationRepository,
        MessageRepository,
        CalculateLimitNovuIntegration,
        OrganizationRepository,
        AnalyticsService,
      ],
      providers: [],
    }).compile();

    session = new UserSession();
    await session.initialize();

    getNovuIntegration = moduleRef.get<GetNovuIntegration>(GetNovuIntegration);
    integrationRepository = moduleRef.get<IntegrationRepository>(
      IntegrationRepository
    );
    messageRepository = moduleRef.get<MessageRepository>(MessageRepository);
  });

  it('should return Novu Email integration', async function () {
    const result = await getNovuIntegration.execute(
      GetNovuIntegrationCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        channelType: ChannelTypeEnum.EMAIL,
        userId: session.user._id,
      })
    );

    expect(result?.providerId).toEqual(EmailProviderIdEnum.Novu);
  });

  it('should return Novu SMS integration', async function () {
    const result = await getNovuIntegration.execute(
      GetNovuIntegrationCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        channelType: ChannelTypeEnum.SMS,
        userId: session.user._id,
      })
    );

    expect(result?.providerId).toEqual(SmsProviderIdEnum.Novu);
  });

  it('should not return Novu integration if there is active integrations', async function () {
    sinon.stub(integrationRepository, 'count').resolves(1);

    const emailResult = await getNovuIntegration.execute(
      GetNovuIntegrationCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        channelType: ChannelTypeEnum.EMAIL,
        userId: session.user._id,
      })
    );

    expect(emailResult).toEqual(undefined);

    const smsResult = await getNovuIntegration.execute(
      GetNovuIntegrationCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        channelType: ChannelTypeEnum.SMS,
        userId: session.user._id,
      })
    );

    expect(smsResult).toEqual(undefined);
  });

  it('should not return Novu Email integration if usage limit was met', async function () {
    sinon
      .stub(messageRepository, 'count')
      .resolves(
        CalculateLimitNovuIntegration.MAX_NOVU_INTEGRATION_MAIL_REQUESTS - 1
      );

    const result = await getNovuIntegration.execute(
      GetNovuIntegrationCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        channelType: ChannelTypeEnum.EMAIL,
        userId: session.user._id,
      })
    );

    expect(result).not.toEqual(undefined);

    sinon.restore();
    sinon
      .stub(messageRepository, 'count')
      .resolves(
        CalculateLimitNovuIntegration.MAX_NOVU_INTEGRATION_MAIL_REQUESTS
      );

    try {
      await getNovuIntegration.execute(
        GetNovuIntegrationCommand.create({
          organizationId: session.organization._id,
          environmentId: session.environment._id,
          channelType: ChannelTypeEnum.EMAIL,
          userId: session.user._id,
        })
      );
      expect(true).toEqual(false);
    } catch (e: any) {
      expect(e.message).toEqual('Limit for Novus email provider was reached.');
    }

    sinon.restore();
    const stub = sinon
      .stub(messageRepository, 'count')
      .resolves(
        CalculateLimitNovuIntegration.MAX_NOVU_INTEGRATION_MAIL_REQUESTS + 1
      );

    try {
      await getNovuIntegration.execute(
        GetNovuIntegrationCommand.create({
          organizationId: session.organization._id,
          environmentId: session.environment._id,
          channelType: ChannelTypeEnum.EMAIL,
          userId: session.user._id,
        })
      );
      expect(true).toEqual(false);
    } catch (e: any) {
      expect(e.message).toEqual('Limit for Novus email provider was reached.');
    }

    sinon.assert.calledWith(stub, {
      channel: ChannelTypeEnum.EMAIL,
      _environmentId: session.environment._id,
      providerId: EmailProviderIdEnum.Novu,
      createdAt: {
        $gte: startOfMonth(new Date()),
        $lte: endOfMonth(new Date()),
      },
    });
  });

  it('should not return Novu SMS integration if usage limit was met', async function () {
    sinon
      .stub(messageRepository, 'count')
      .resolves(
        CalculateLimitNovuIntegration.MAX_NOVU_INTEGRATION_SMS_REQUESTS - 1
      );

    const result = await getNovuIntegration.execute(
      GetNovuIntegrationCommand.create({
        organizationId: session.organization._id,
        environmentId: session.environment._id,
        channelType: ChannelTypeEnum.SMS,
        userId: session.user._id,
      })
    );

    expect(result).not.toEqual(undefined);

    sinon.restore();
    sinon
      .stub(messageRepository, 'count')
      .resolves(
        CalculateLimitNovuIntegration.MAX_NOVU_INTEGRATION_SMS_REQUESTS
      );

    try {
      await getNovuIntegration.execute(
        GetNovuIntegrationCommand.create({
          organizationId: session.organization._id,
          environmentId: session.environment._id,
          channelType: ChannelTypeEnum.SMS,
          userId: session.user._id,
        })
      );
      expect(true).toEqual(false);
    } catch (e: any) {
      expect(e.message).toEqual('Limit for Novus sms provider was reached.');
    }

    sinon.restore();
    const stub = sinon
      .stub(messageRepository, 'count')
      .resolves(
        CalculateLimitNovuIntegration.MAX_NOVU_INTEGRATION_SMS_REQUESTS + 1
      );

    try {
      await getNovuIntegration.execute(
        GetNovuIntegrationCommand.create({
          organizationId: session.organization._id,
          environmentId: session.environment._id,
          channelType: ChannelTypeEnum.SMS,
          userId: session.user._id,
        })
      );
      expect(true).toEqual(false);
    } catch (e: any) {
      expect(e.message).toEqual('Limit for Novus sms provider was reached.');
    }

    sinon.assert.calledWith(stub, {
      channel: ChannelTypeEnum.SMS,
      _environmentId: session.environment._id,
      providerId: SmsProviderIdEnum.Novu,
      createdAt: {
        $gte: startOfMonth(new Date()),
        $lte: endOfMonth(new Date()),
      },
    });
  });

  it('should map novu email to sendgrid', () => {
    let result = GetNovuIntegration.mapProviders(
      ChannelTypeEnum.EMAIL,
      EmailProviderIdEnum.Novu
    );

    expect(result).toEqual(EmailProviderIdEnum.SendGrid);

    result = GetNovuIntegration.mapProviders(
      ChannelTypeEnum.EMAIL,
      EmailProviderIdEnum.CustomSMTP
    );
    expect(result).toEqual(EmailProviderIdEnum.CustomSMTP);
  });

  it('should map novu email to twilio', () => {
    const result = GetNovuIntegration.mapProviders(
      ChannelTypeEnum.SMS,
      EmailProviderIdEnum.Novu
    );

    expect(result).toEqual(SmsProviderIdEnum.Twilio);
  });
});
