import { asyncHandler } from '../../common/utils/asyncHandler';
import { listOpenRouterModels } from './models.service';
import { listPlatformChatModels } from './platformChat.models';
import { replyToPlatformChat } from './platformChat.service';

export const listModels = asyncHandler(async (_req, res) => {
  const models = await listOpenRouterModels();
  res.json({ models });
});

export const listPlatformChatModelOptions = asyncHandler(async (_req, res) => {
  res.json({ models: listPlatformChatModels() });
});

export const platformChat = asyncHandler(async (req, res) => {
  const { reply, model } = await replyToPlatformChat(req.body.messages, req.body.model);
  res.json({ reply, model });
});
