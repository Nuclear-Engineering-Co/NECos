/**
 * @name affiliates.ts
 * @description Extends the Extension class to create an affiliates management handler.
 * @author imskyyc
 * @repository https://github.com/Nuclear-Engineering-Co/NECos
 * @license AGPL3
 * @copyright Copyright (C) 2022 imskyyc (https://github.com/imskyyc)
   This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

 * @param { typeof NECos }
 */

import { BaseExtension } from "../classes/BaseExtension.js";
import {
  CommandInteraction,
  Message,
  Collection,
  Guild as DiscordGuild,
  Channel,
  WebhookClient,
  WebhookCreateMessageOptions,
} from "discord.js";
import { Knex } from "knex";
import { Guild, AffiliateGuildData } from "../../Interfaces.js";
export default class Affiliates extends BaseExtension {
  guildData: Collection<string, AffiliateGuildData> = new Collection();

  constructor(NECos) {
    super(NECos);

    this.up();
  }

  onUpdateInteraction = async (Interaction: CommandInteraction) => {
    if (!Interaction.inCachedGuild()) return;
  };

  onAffiliateAnnouncement = async (message: Message) => {
    const guild = message.guild;

    let affiliateGuildData = await this.guildData.get(guild.id);

    if (!affiliateGuildData) {
      await this.up();
      affiliateGuildData = await this.guildData.get(guild.id);
    }

    if (!affiliateGuildData) return;

    const announcementWebhookClients =
      affiliateGuildData.announcementWebhookClients;
    const listenerChannelIds = affiliateGuildData.listenerChannelIds;
    if (!listenerChannelIds.includes(message.channel.id)) return;

    const announcementPayload: WebhookCreateMessageOptions = {
      username: message.author.username,
      avatarURL: message.author.avatarURL(),

      content: message.content,
      files: Array.from(message.attachments.values()),
    };

    for (const announcementWebhook of announcementWebhookClients) {
      try {
        await announcementWebhook.send(announcementPayload);
      } catch (error) {
        console.log(error);
      }
    }
  };

  // Loader functions
  up = async () => {
    const database: Knex = this.NECos.database;
    const guilds = await database<Guild>("guilds").select("*");

    for (const guildData of guilds) {
      const guild = await this.Bot.client.guilds.resolve(guildData.guild_id);
      if (!guild) continue;

      const configuration = JSON.parse(guildData.configuration);
      const affiliatesChannels = configuration.affiliates;

      if (
        !affiliatesChannels ||
        !affiliatesChannels.listenerChannelIds ||
        !affiliatesChannels.announcementWebhookData
      )
        continue;

      const affiliateGuildData = {
        guildId: guild.id,
        announcementWebhookClients: [],
        listenerChannelIds: [],
      };

      for (const key of Object.keys(affiliatesChannels.listenerChannelIds)) {
        const listenerChannelId = affiliatesChannels.listenerChannelIds[key];

        const channel: Channel = await this.Bot.client.channels.resolve(
          listenerChannelId
        );
        if (!channel || !channel.isTextBased()) continue;

        affiliateGuildData.listenerChannelIds.push(channel.id);
      }

      for (const key of Object.keys(
        affiliatesChannels.announcementWebhookData
      )) {
        const announcementWebhookData =
          affiliatesChannels.announcementWebhookData[key];

        const webhookClient = new WebhookClient(
          {
            id: announcementWebhookData.id,
            token: announcementWebhookData.token,
          },
          {
            allowedMentions: {
              parse: [],
            },
          }
        );

        affiliateGuildData.announcementWebhookClients.push(webhookClient);
      }

      if (
        affiliateGuildData.announcementWebhookClients.length == 0 ||
        affiliateGuildData.listenerChannelIds.length == 0
      )
        return;

      this.guildData.set(guild.id, affiliateGuildData);
    }

    this.Bot.commands
      .get("verification")
      .get("update")
      .on("command", this.onUpdateInteraction);
  };

  down = async () => {};
}
