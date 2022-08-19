'use strict';

const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const bot = new Telegraf(process.env.TOKEN);
const client = new MongoClient(process.env.DB_URL);

bot.start((ctx) => ctx.reply('Кринж в чате)'));
const connect = (async () => await client.connect())().then(
  console.log('Connected to database')
);

const COMMAND_TIMEOUT = 30000;

bot.command('cringe', async (ctx) => {
  try {
    if (!!ctx.update.message.reply_to_message) {
      const users = client.db().collection('users');
      const username =
        ctx.update.message.reply_to_message.from.username ||
        ctx.update.message.reply_to_message.sender_chat.title;
      const user = await users.findOne({
        username: username,
        chatId: ctx.update.message.chat.id,
      });
      let isChannel = false;
      if (
        !!ctx.update.message.reply_to_message.sender_chat &&
        ctx.update.message.reply_to_message.sender_chat.type === 'channel'
      )
        isChannel = true;
      if (!user.lastUsedBy)
        users.updateOne(
          { username: username, chatId: ctx.update.message.chat.id },
          { $set: { lastUsedBy: ctx.update.message.from.username } }
        );
      const emoji = String.fromCodePoint(0x1f4a9);
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: 1,
          chatId: ctx.update.message.chat.id,
          isChannel: isChannel,
          lastUsed: Date.now(),
          lastUsedBy: ctx.update.message.from.username,
        });
        ctx.reply(`${emoji} кринж`);
        console.log(username, '+1');
      } else {
        if (ctx.update.message.from.username !== user.lastUsedBy) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username, chatId: ctx.update.message.chat.id },
            { $set: { cringeRate: newRate, lastUsed: Date.now(), lastUsedBy: ctx.update.message.from.username } }
          );
          ctx.reply(`${emoji} кринж`);
          console.log(username, '+1');
        } else if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username, chatId: ctx.update.message.chat.id },
            { $set: { cringeRate: newRate, lastUsed: Date.now(), lastUsedBy: ctx.update.message.from.username } }
          );
          ctx.reply(`${emoji} кринж`);
          console.log(username, '+1');
        } else {
          ctx.reply(
            'Команды cringe и baza можно использовать не чаще, чем раз в 30 секунд',
            { reply_to_message_id: ctx.message.message_id }
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('baza', async (ctx) => {
  try {
    if (!!ctx.update.message.reply_to_message) {
      const users = client.db().collection('users');
      const username =
        ctx.update.message.reply_to_message.from.username ||
        ctx.update.message.reply_to_message.sender_chat.title;
      const user = await users.findOne({
        username: username,
        chatId: ctx.update.message.chat.id,
      });
      let isChannel = false;
      if (
        !!ctx.update.message.reply_to_message.sender_chat &&
        ctx.update.message.reply_to_message.sender_chat.type === 'channel'
      )
        isChannel = true;
      const emoji = String.fromCodePoint(0x1f349);
      if (!user) {
        await users.insertOne({
          username: username,
          cringeRate: -1,
          chatId: ctx.update.message.chat.id,
          isChannel: isChannel,
          lastUsed: Date.now(),
          lastUsedBy: ctx.update.message.from.username,
        });
        ctx.reply(`${emoji} база`);
        console.log(username, '-1');
      } else {
        if (ctx.update.message.from.username !== user.lastUsedBy) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username, chatId: ctx.update.message.chat.id },
            { $set: { cringeRate: newRate, lastUsed: Date.now(), lastUsedBy: ctx.update.message.from.username } }
          );
          ctx.reply(`${emoji} база`);
          console.log(username, '-1');
        } else if (Date.now() - user.lastUsed > COMMAND_TIMEOUT) {
          const newRate = user.cringeRate + 1;
          users.updateOne(
            { username: username, chatId: ctx.update.message.chat.id },
            { $set: { cringeRate: newRate, lastUsed: Date.now(), lastUsedBy: ctx.update.message.from.username } }
          );
          ctx.reply(`${emoji} база`);
          console.log(username, '-1');
        } else {
          ctx.reply(
            'Kоманды cringe и baza можно использовать не чаще, чем раз в 30 секунд',
            { reply_to_message_id: ctx.message.message_id }
          );
        }
      }
    }
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('mycringe', async (ctx) => {
  try {
    const users = client.db().collection('users');
    const myUsername = ctx.update.message.from.username;
    const me = await users.findOne({
      username: myUsername,
      chatId: ctx.update.message.chat.id,
    });
    if (!me) {
      ctx.reply(`@${myUsername}, с тебя еще не кринжевали!`);
    } else {
      if (me.cringeRate < 0) {
        const bazaEmoji = String.fromCodePoint(0x1f7e2);
        ctx.reply(
          `${bazaEmoji} @${myUsername}, твой счет базы в этом чате: ${
            -1 * me.cringeRate
          }`
        );
      } else {
        const cringeEmoji = String.fromCodePoint(0x1f534);
        ctx.reply(
          `${cringeEmoji} @${myUsername}, твой счет кринжа в этом чате: ${me.cringeRate}`
        );
      }
    }
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('topcringe', async (ctx) => {
  try {
    let reply = [];
    const users = client.db().collection('users');
    const topCursor = users.aggregate([
      { $match: { chatId: ctx.update.message.chat.id } },
      { $sort: { cringeRate: -1 } },
      { $limit: 5 },
    ]);
    let place = 1;
    await topCursor.forEach((user) => {
      if (user.cringeRate >= 0) {
        if (user.isChannel)
          reply.push(`${place}. ${user.username}: ${user.cringeRate} `);
        else
          reply.push(
            `${place}. <a href="t.me/${user.username}">${user.username}</a>: ${user.cringeRate} `
          );
      }
      place++;
    });
    ctx.reply(
      `Топ-${reply.length} по кринжу в этом чате:\n` + reply.join('\n'),
      { parse_mode: 'HTML', disable_web_page_preview: true }
    );
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.command('topbaza', async (ctx) => {
  try {
    let reply = [];
    const users = client.db().collection('users');
    const topCursor = users.aggregate([
      { $match: { chatId: ctx.update.message.chat.id } },
      { $sort: { cringeRate: 1 } },
      { $limit: 5 },
    ]);
    let place = 1;
    await topCursor.forEach((user) => {
      if (user.cringeRate <= 0) {
        if (user.isChannel)
          reply.push(`${place}. ${user.username}: ${-1 * user.cringeRate}`);
        else
          reply.push(
            `${place}. <a href="t.me/${user.username}">${user.username}</a>: ${
              -1 * user.cringeRate
            } `
          );
      }
      place++;
    });
    ctx.reply(`Топ-${reply.length} по базе в этом чате:\n` + reply.join('\n'), {
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    });
  } catch (err) {
    console.log(err);
    ctx.reply('Ошибка, напишите создателю!');
  }
});

bot.launch().then(console.log('Bot is running'));
