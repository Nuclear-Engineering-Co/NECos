import { CommandInteraction, Colors } from "discord.js";
import { Knex } from "knex";
import { BaseCommand } from "../../classes/BaseCommand.js";
import { User, Guild } from "../../../Interfaces.js";

export default class UpdateCommand extends BaseCommand {
  name = "update";
  description =
    "Allows users to re-obtain roles, and reset their nickname based on the guild's ROBLOX bind data.";
  usage = "/update";

  cooldown = 15;

  constructor(Bot) {
    super(Bot);
  }

  onCommand = async function (
    Interaction: CommandInteraction
  ): Promise<[boolean, string]> {
    if (!Interaction.inCachedGuild() || !Interaction.isChatInputCommand())
      return;

    const guild = Interaction.guild;
    const member = Interaction.member;

    const database: Knex = this.NECos.database;

    const user = await database<User>("users")
      .select("*")
      .where("user_id", member.id.toString())
      .first();
    if (!user) {
      await Interaction.editReply({
        embeds: [
          this.Bot.createEmbed({
            color: Colors.Red,
            title: "User Update",
            description:
              "You must be verified with NECos before running /update.",
          }),
        ],
      });

      return [true, ""];
    }

    const guildData = await database<Guild>("guilds")
      .select("*")
      .where("guild_id", guild.id.toString())
      .first();
    if (!guildData) {
      await Interaction.editReply({
        embeds: [
          this.Bot.createEmbed({
            color: Colors.Red,
            title: "User Update",
            description: `User update failed to due guild data being empty (for guild_id ${guild.id}). Contact a guild administrator.`,
          }),
        ],
      });

      return [true, ""];
    }

    const errors = await this.Bot.updateUser(member, guild, guildData, user);

    let errorString = "";
    if (errors.length > 0) {
      errorString = `Errors: ${errors.join(" ")}`;
    }

    await Interaction.editReply({
      embeds: [
        this.Bot.createEmbed({
          color: (errors.length > 0 && Colors.Orange) || Colors.Green,
          title: "User Update",
          description: `Update for <@${member.id}> successful. ${errorString}`,
        }),
      ],
    });

    return [true, ""];
  };
}
