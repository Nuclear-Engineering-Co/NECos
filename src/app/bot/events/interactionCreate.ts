/**
 * @name interactionCreate.ts
 * @description Function bound on bot start which handles whenever an interaction (of any type) is created against the API
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

 * @param { typeof Bot }
 * @param { typeof BaseInteraction }
 */

import { Collection, BaseInteraction, Colors } from "discord.js";
import { BaseCommand } from "../classes/BaseCommand.js";

const cooldownData: Collection<
  string,
  Collection<string, number>
> = new Collection();
const commandTrackers: Collection<
  string,
  Collection<string, boolean>
> = new Collection();

export default async (Bot, Interaction: BaseInteraction) => {
  if (!Interaction.inCachedGuild()) return;
  const member = Interaction.member;

  if (Interaction.isChatInputCommand() && Bot.commands) {
    // Defer interaction
    await Interaction.deferReply();

    // Handle command interactons
    const commands: Collection<
      string,
      Collection<string, BaseCommand>
    > = Bot.commands;
    let command: BaseCommand = null;

    const options = Interaction.options;
    let subCommandName = undefined;
    let subCommand = undefined;

    try {
      subCommandName = await options.getSubcommand();
    } catch (error) {}

    for (const key of Array.from(commands.keys())) {
      const category = commands.get(key);
      command = category.find(
        (command) => command.name === Interaction.commandName
      );

      if (command) break;
    }

    let commandName = command.name;

    if (subCommandName) {
      for (const subCom of command.subCommands) {
        if (subCom.name == subCommandName) {
          subCommand = subCom;

          commandName = commandName + " " + subCom.name;

          break;
        }
      }
    }

    // check cooldown
    if (command.cooldown) {
      if (!cooldownData.has(command.name)) {
        cooldownData.set(command.name, new Collection());
      }

      const now = new Date().getTime();
      const commandCooldownData = cooldownData.get(command.name);
      const cooldownTime = commandCooldownData.get(member.id);
      const cooldownAmount = (command.cooldown || 0) * 1000;

      if (cooldownTime !== null && cooldownTime > 0) {
        const timeLeft = (cooldownTime - now) / 1000;
        return Interaction.editReply({
          embeds: [
            Bot.createEmbed({
              title: "Command Cooldown",
              description: `Please wait ${timeLeft.toFixed(
                1
              )} more second(s) before executing ${command.name}.`,
              color: Colors.Red,
            }),
          ],
        });
      } else {
        commandCooldownData.set(member.id, now + cooldownAmount);
        setTimeout(() => commandCooldownData.delete(member.id), cooldownAmount);
      }
    }

    // check permissions
    let canExecute = command.defaultPermission == null;

    if (
      (command.defaultPermission &&
        member.permissions.has(command.defaultPermission)) ||
      (subCommand &&
        subCommand.defaultPermission &&
        member.permissions.has(subCommand.defaultPermission))
    ) {
      canExecute = true;
    }

    if (command.developer && member.id != "250805980491808768")
      canExecute = false;

    if (!canExecute) {
      await Interaction.editReply({
        embeds: [
          Bot.createEmbed({
            color: Colors.Red,
            title: "Unauthorized.",
            description: "You do not have permission to execute that command.",
          }),
        ],
      });

      return;
    }

    if (!commandTrackers.has(commandName)) {
      commandTrackers.set(commandName, new Collection());
    }

    const commandTracker = commandTrackers.get(commandName);
    if (commandTracker.has(member.id)) return;

    commandTracker.set(member.id, true);
    var [commandExecuted, commandReturn] = [false, ""];

    try {
      await Bot.channelLogging.push(Interaction.guild, "commandLogs", {
        color: Colors.Orange,
        title: "Command Executed",
        description: `<@${member.id}> executed command \`${commandName}\``,
        thumbnail: {
          url: member.user.avatarURL(),
        },
      });
    } catch (error) {}

    try {
      command.emit("command", Interaction);

      if (subCommand) {
        [commandExecuted, commandReturn] = await subCommand.onCommand(
          Interaction
        );
      } else {
        [commandExecuted, commandReturn] = await command.onCommand(Interaction);
      }
    } catch (error) {
      console.error(error);
      console.error(
        `Command ${command.name} encountered an error onCommand. Please investigate the above output.`
      );

      const embed = Bot.createEmbed({
        title: "Command Error",
        description: `Comand ${command.name} ran in to an error: ${error}.`,
        color: Colors.Red,
      });

      return Interaction.editReply({
        content: "",
        files: [],

        embeds: [embed],
        components: [],
      });
    }

    try {
      await commandTracker.delete(member.id);
    } catch (error) {
      console.error(error);
      console.warn(
        `Command Tracker failed to delete ${member.id}. Please investigate the above output.`
      );
    }

    if (!commandExecuted) {
      const embed = Bot.createEmbed({
        title: "Command Execution Failed",
        description: `Command ${command.name} failed to execute: ${commandReturn}`,
        color: Colors.Red,
      });

      return Interaction.editReply({
        content: "",
        files: [],

        embeds: [embed],
        components: [],
      });
    }
  }
};
