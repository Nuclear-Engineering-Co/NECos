/**
 * @name music.ts
 * @description Extends the Extension class to create a music / song request handler.
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
import { createAudioPlayer, NoSubscriberBehavior } from "@discordjs/voice";
import { Collection, Guild } from "discord.js";
import { PlayerData } from "../classes/PlayerData.js";
import SpotifyApi from "spotify-web-api-node";

export default class Music extends BaseExtension {
  queue = {};
  cooldowns = {};

  playerData = new Collection<Guild, PlayerData>();
  spotifyApi = null;

  constructor(NECos) {
    super(NECos);

    this.up();
  }

  requestSong = async (guild: Guild, songQuery: string) => {
    if (!this.playerData.get(guild)) {
      this.playerData.set(
        guild,
        new PlayerData(
          guild,
          createAudioPlayer({
            behaviors: {
              noSubscriber: NoSubscriberBehavior.Pause,
            },
          })
        )
      );
    }

    const playerData = this.playerData.get(guild);
    playerData.queue.push(songQuery);

    playerData.bumpQueue();
  };

  awaitSpotifyCallbackFetch = async () => {};

  // Loader functions
  up = async () => {
    return;
    this.spotifyApi = new SpotifyApi({
      clientId: this.Bot.configuration.spotify.client_id,
      clientSecret: this.Bot.configuration.spotify.client_secret,
      redirectUri: "https://www.necos.dev/api/spotify_callback",
    });

    try {
      const bruh = await this.spotifyApi.getArtistAlbums(
        "3PhoLpVuITZKcymswpck5b"
      );

      console.log(bruh);
    } catch (error) {
      console.log("bruh!!");
      console.log(error);
    }
  };

  down = async () => {};
}
