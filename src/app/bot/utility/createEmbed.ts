/**
 * @name generatePresence.ts
 * @description Function that generates presence data
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
 * @returns { MessageEmbed }
 */

import { EmbedBuilder } from "@discordjs/builders";

export default (Bot, embedData): EmbedBuilder => {
  const data = embedData || {};

  const embed = new EmbedBuilder(data);
  if (!data.author) {
    embed.setAuthor({
      name: "NECos",
      url: Bot.NECos.configuration.app.github_url,
      iconURL: Bot.configuration.embed_footer_icon_url,
    });
  }

  embed.setTimestamp();

  return embed;
};
